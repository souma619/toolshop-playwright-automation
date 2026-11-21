import { test, expect } from '../../fixtures/test-fixtures';
import { CARD, CART, PAYMENT_METHOD, formatExpiry, guestUser } from '../../data/test-data';
import type { CartPage } from '../../pages/CartPage';
import type { CheckoutPage } from '../../pages/CheckoutPage';
import type { ProductsPage } from '../../pages/ProductsPage';

// Checkout tests use guest checkout: no account is needed, so every test is independent
// and no passwords are involved. They stop at the payment step, which is the part under test.
async function reachPaymentStep(pages: {
  productsPage: ProductsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
}): Promise<void> {
  const { productsPage, cartPage, checkoutPage } = pages;
  await productsPage.addFirstProductToCart();
  await cartPage.goto();
  await cartPage.proceedToSignIn.click();
  await checkoutPage.continueAsGuest(guestUser());
  await checkoutPage.fillBillingAddress();
}

test.describe('Checkout and payment', () => {
  /*
   * Priority: P1 | Type: Positive
   * Preconditions: Cart contains an item and valid card details are known.
   * Steps:
   * 1. Proceed to checkout as a guest and fill the billing address.
   * 2. Choose Credit Card and fill valid card details.
   * 3. Confirm payment.
   * Expected Result: The valid card payment succeeds and confirmation is shown.
   */
  test('TC-13 [P1][Positive] Checkout with a valid credit card @P1 @positive @automated', async ({
    productsPage,
    cartPage,
    checkoutPage,
  }) => {
    await reachPaymentStep({ productsPage, cartPage, checkoutPage });

    await test.step('Pay with a valid credit card', async () => {
      await checkoutPage.selectPaymentMethod(PAYMENT_METHOD.creditCard);
      await checkoutPage.fillCardDetails({ number: CARD.validNumber, expiry: formatExpiry(12) });
      await checkoutPage.confirmButton.click();
    });

    await test.step('Verify the order is confirmed', async () => {
      await checkoutPage.expectConfirmation();
    });
  });

  /*
   * Priority: P1 | Type: Negative
   * Preconditions: Cart contains an item.
   * Steps:
   * 1. Proceed to checkout as a guest and fill the billing address.
   * 2. Choose Credit Card and enter an invalid card number.
   * 3. Try to confirm payment.
   * Expected Result: Payment is rejected and clear card validation is displayed.
   */
  test('TC-14 [P1][Negative] Checkout with an invalid card number @P1 @negative @automated', async ({
    page,
    productsPage,
    cartPage,
    checkoutPage,
  }) => {
    await reachPaymentStep({ productsPage, cartPage, checkoutPage });

    await checkoutPage.selectPaymentMethod(PAYMENT_METHOD.creditCard);
    await checkoutPage.fillCardDetails({ number: CARD.invalidNumber, expiry: formatExpiry(12) });

    await test.step('The card number is flagged as invalid', async () => {
      await expect(checkoutPage.cardNumber).toHaveClass(/ng-invalid/);
      await expect(checkoutPage.validationErrors.first()).toBeVisible();
    });

    await test.step('The payment is not completed', async () => {
      // The form may disable Confirm for invalid data; if it is enabled, submitting must still fail
      if (await checkoutPage.confirmButton.isEnabled()) {
        await checkoutPage.confirmButton.click();
      }
      await expect(checkoutPage.successMessage).toHaveCount(0);
      await expect(page).toHaveURL(/\/checkout/);
    });
  });

  /*
   * Priority: P1 | Type: Positive
   * Preconditions: Cart contains an item and cash on delivery is offered.
   * Steps:
   * 1. Proceed to checkout as a guest and fill the billing address.
   * 2. Select cash on delivery.
   * 3. Confirm the order.
   * Expected Result: The order is confirmed without card payment details.
   */
  test('TC-15 [P1][Positive] Checkout using cash on delivery @P1 @positive @automated', async ({
    productsPage,
    cartPage,
    checkoutPage,
  }) => {
    await reachPaymentStep({ productsPage, cartPage, checkoutPage });

    await test.step('Select cash on delivery', async () => {
      await checkoutPage.selectPaymentMethod(PAYMENT_METHOD.cashOnDelivery);
      // No card details are needed for this method
      await expect(checkoutPage.cardNumber).toBeHidden();
      await checkoutPage.confirmButton.click();
    });

    await test.step('Verify the order is confirmed', async () => {
      await checkoutPage.expectConfirmation();
    });
  });

  /*
   * Priority: P2 | Type: Negative
   * Preconditions: Cart is empty (an item is added and then removed).
   * Steps:
   * 1. Add an item, open the cart and remove the item.
   * 2. Inspect the cart page and the checkout action.
   * Expected Result: Checkout is blocked and the user is told the cart is empty.
   * Note: opening /checkout in a brand-new browser with no cart at all renders a blank page and
   *       logs a "cart_items" script error in the app. That looks like an app defect, so the test
   *       uses the supported way to reach an empty cart: removing the last item.
   */
  test('TC-16 [P2][Negative] Attempt checkout with an empty cart @P2 @negative @automated', async ({
    productsPage,
    cartPage,
  }) => {
    await productsPage.addFirstProductToCart();
    await cartPage.goto();
    await expect(cartPage.lineItems).toHaveCount(1);

    await test.step('Remove the only item', async () => {
      await cartPage.removeButton.click();
    });

    await test.step('Checkout is blocked with a clear message', async () => {
      await expect(cartPage.emptyMessage).toHaveText(CART.emptyMessage);
      // There is nothing to check out, so no way forward and no cart badge
      await expect(cartPage.proceedToSignIn).toHaveCount(0);
      await expect(cartPage.headerQuantity).toHaveCount(0);
    });
  });

  /*
   * Priority: P3 | Type: Edge
   * Preconditions: Cart contains an item and the current date is known.
   * Steps:
   * 1. Enter an expiry date for the previous month.
   * 2. Enter an expiry date for the current month.
   * 3. Enter an expiry date well in the future.
   * Expected Result: An expired month is rejected, a future date is accepted, and the current-month
   *                  behaviour is recorded as an annotation in the report.
   */
  test('TC-17 [P3][Edge] Checkout near card expiry boundary @P3 @edge @automated', async ({
    productsPage,
    cartPage,
    checkoutPage,
  }) => {
    await reachPaymentStep({ productsPage, cartPage, checkoutPage });
    await checkoutPage.selectPaymentMethod(PAYMENT_METHOD.creditCard);
    // Everything except the expiry date is valid, so any error comes from the expiry date alone
    await checkoutPage.fillCardDetails({ number: CARD.validNumber, expiry: formatExpiry(12) });
    await expect(checkoutPage.expiryDate).toHaveClass(/ng-valid/);

    await test.step('Previous month (expired) is rejected', async () => {
      await checkoutPage.expiryDate.fill(formatExpiry(-1));
      await checkoutPage.expiryDate.blur();
      await expect(checkoutPage.expiryDate).toHaveClass(/ng-invalid/);
      await expect(checkoutPage.validationErrors.first()).toBeVisible();
    });

    await test.step('Current month: record how the app treats the boundary', async () => {
      const current = formatExpiry(0);
      await checkoutPage.expiryDate.fill(current);
      await checkoutPage.expiryDate.blur();
      // Wait for validation to run, then record the outcome instead of assuming one
      await expect(checkoutPage.expiryDate).toHaveClass(/ng-(valid|invalid)/);
      const rejected = /ng-invalid/.test((await checkoutPage.expiryDate.getAttribute('class')) ?? '');
      test.info().annotations.push({
        type: 'observed',
        description: `Expiry ${current} (current month) was ${rejected ? 'rejected' : 'accepted'}`,
      });
    });

    await test.step('A future date is accepted', async () => {
      await checkoutPage.expiryDate.fill(formatExpiry(12));
      await checkoutPage.expiryDate.blur();
      await expect(checkoutPage.expiryDate).toHaveClass(/ng-valid/);
    });
  });
});
