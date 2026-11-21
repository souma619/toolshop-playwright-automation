import { test, expect } from '../../fixtures/test-fixtures';
import {
  CARD,
  E2E,
  PAYMENT_METHOD,
  VALID_PASSWORD,
  formatExpiry,
  uniqueEmail,
} from '../../data/test-data';
import { registerUser } from '../../utils/auth';
import {
  addItemsToCart,
  addItemsToFavourites,
  updateQuantityInCart,
  verifyCartContents,
  verifyCheckboxFilters,
  verifyFavouritesListed,
  verifyHomepage,
  verifyPagination,
  verifyPriceRange,
  verifyPriceSorting,
  verifySearch,
} from '../../utils/e2e-flows';
import type { CheckoutPage } from '../../pages/CheckoutPage';

/*
 * End-to-end scenarios for the Toolshop customer.
 *
 *  E2E-01  Complete customer journey (register -> logout -> login -> browse -> cart -> favourites -> checkout)
 *  E2E-02  Homepage validation
 *  E2E-03  Sort products by price
 *  E2E-04  Filter by price range
 *  E2E-05  Search and brand/category checkbox filters
 *  E2E-06  Pagination
 *  E2E-07..11  Checkout with each payment method
 *  E2E-12  Order appears in the invoice history
 *  E2E-13  Favourites survive logout and login
 *  E2E-14  Removing an item updates the cart total
 *
 * Run only these with:  npx playwright test --grep @e2e
 */

// Each payment method needs its own details. This table keeps the five scenarios identical in
// structure and different only in how the payment is entered.
const PAYMENT_SCENARIOS: Array<{
  id: string;
  method: string;
  enterPayment: (checkout: CheckoutPage) => Promise<void>;
}> = [
  { id: 'E2E-07', method: 'Bank Transfer', enterPayment: (checkout) => checkout.confirmBankTransfer() },
  {
    id: 'E2E-08',
    method: 'Cash on Delivery',
    enterPayment: (checkout) => checkout.selectPaymentMethod(PAYMENT_METHOD.cashOnDelivery),
  },
  {
    id: 'E2E-09',
    method: 'Credit Card',
    enterPayment: async (checkout) => {
      await checkout.selectPaymentMethod(PAYMENT_METHOD.creditCard);
      await checkout.fillCardDetails({ number: CARD.validNumber, expiry: formatExpiry(12) });
    },
  },
  { id: 'E2E-10', method: 'Buy Now Pay Later', enterPayment: (checkout) => checkout.payWithBuyNowPayLater() },
  { id: 'E2E-11', method: 'Gift Card', enterPayment: (checkout) => checkout.payWithGiftCard() },
];

test.describe('E2E: customer journey', () => {
  /*
   * Priority: P1 | Type: Positive
   * Preconditions: None (a new customer is registered by the test).
   * Steps: register, log out, log in, validate the homepage, sort, filter by price, search, use the
   *        checkboxes, page through the catalog, add items to the cart and favourites, change a
   *        quantity, and check out.
   * Expected Result: Every step behaves as a shopper expects and the order is confirmed.
   */
  test('E2E-01 [P1] Complete customer journey from registration to order confirmation @e2e @journey', async ({
    page,
    header,
    loginPage,
    productsPage,
    cartPage,
    checkoutPage,
    api,
  }) => {
    test.setTimeout(240_000); // a long journey: many page loads against a shared demo site
    const user = {
      email: uniqueEmail('qa.journey'),
      password: VALID_PASSWORD,
      firstName: 'Journey',
      lastName: 'Tester',
    };
    const pages = { page, header, productsPage, cartPage, checkoutPage, api };

    await test.step('Register a new customer', async () => {
      await registerUser(page, user);
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    await test.step('Log in', async () => {
      await loginPage.login(user.email, user.password);
      await expect(page).toHaveURL(/\/account/);
      await expect(header.navMenu).toBeVisible();
    });

    await test.step('Log out', async () => {
      await header.signOut();
    });

    await test.step('Log in again', async () => {
      await loginPage.goto();
      await loginPage.login(user.email, user.password);
      await expect(header.navMenu).toBeVisible();
    });

    await test.step('Homepage is displayed correctly', async () => {
      await verifyHomepage(pages);
    });

    await test.step('Sort by price, low to high', async () => {
      await verifyPriceSorting(productsPage, 'price,asc');
    });

    await test.step('Filter by price range', async () => {
      await verifyPriceRange(pages, E2E.maxPrice);
    });

    await test.step('Search for a product', async () => {
      await verifySearch(pages, E2E.searchTerm);
    });

    await test.step('Select brand and category checkboxes', async () => {
      await verifyCheckboxFilters(pages);
    });

    await test.step('Move between pages', async () => {
      await verifyPagination(pages);
    });

    await test.step('Add several items to the cart', async () => {
      await addItemsToCart(pages, E2E.itemsInCart);
      await verifyCartContents(cartPage, E2E.itemsInCart);
    });

    await test.step('Add several items to favourites', async () => {
      const favourites = await addItemsToFavourites(pages, E2E.itemsInFavourites);
      await verifyFavouritesListed(pages, favourites);
    });

    await test.step('Update a quantity in the cart', async () => {
      await cartPage.goto();
      await updateQuantityInCart(cartPage, header, E2E.updatedQuantity);
    });

    await test.step('Proceed to checkout and pay by credit card', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.fillBillingAddress();
      await checkoutPage.selectPaymentMethod(PAYMENT_METHOD.creditCard);
      await checkoutPage.fillCardDetails({ number: CARD.validNumber, expiry: formatExpiry(12) });
      await checkoutPage.confirmButton.click();
      await checkoutPage.expectConfirmation();
    });
  });

  /*
   * Priority: P2 | Type: Positive
   * Preconditions: None.
   * Steps: Open the homepage.
   * Expected Result: Title, navigation, a full page of priced products and all filter controls show.
   */
  test('E2E-02 [P2] Homepage shows navigation, products and filters @e2e @smoke', async ({
    page,
    header,
    productsPage,
  }) => {
    await verifyHomepage({ page, header, productsPage });
  });

  /*
   * Priority: P2 | Type: Positive
   * Steps: Sort by price low-high, then high-low.
   * Expected Result: Prices on the page follow the chosen order.
   */
  for (const { value, label } of E2E.sortCases) {
    test(`E2E-03 [P2] Sort products by ${label} @e2e @sort`, async ({ productsPage }) => {
      await verifyPriceSorting(productsPage, value);
    });
  }

  /*
   * Priority: P2 | Type: Positive
   * Steps: Drag the upper price handle down to the maximum price.
   * Expected Result: Only products up to that price are shown, matching the API.
   */
  test('E2E-04 [P2] Filter products by price range @e2e @filter', async ({ productsPage, api }) => {
    await verifyPriceRange({ productsPage, api }, E2E.maxPrice);
  });

  /*
   * Priority: P2 | Type: Positive
   * Steps: Search for a term; then use the brand and category checkboxes alone and together.
   * Expected Result: Results match what the API returns for the same filters.
   */
  test('E2E-05 [P2] Search and checkbox filters return the right products @e2e @filter', async ({
    productsPage,
    api,
  }) => {
    await verifySearch({ productsPage, api }, E2E.searchTerm);
    await verifyCheckboxFilters({ productsPage, api });
  });

  /*
   * Priority: P2 | Type: Positive
   * Steps: Click page 2, page 3, Next and Previous.
   * Expected Result: The active page and the products change accordingly.
   */
  test('E2E-06 [P2] Pagination moves through the catalog @e2e @pagination', async ({ page, productsPage }) => {
    await verifyPagination({ page, productsPage });
  });

  /*
   * Priority: P1 | Type: Positive
   * Preconditions: A registered customer with one item in the cart.
   * Steps: Log in, check out and pay with the given method.
   * Expected Result: The payment is accepted and the order is confirmed.
   */
  test.describe('Checkout by payment method', () => {
    test.describe.configure({ timeout: 90_000 }); // registration + login + checkout in one test

    for (const { id, method, enterPayment } of PAYMENT_SCENARIOS) {
      test(`${id} [P1] Checkout with ${method} @e2e @payment`, async ({
        page,
        header,
        loginPage,
        productsPage,
        cartPage,
        checkoutPage,
        registeredUser,
      }) => {
        await loginPage.login(registeredUser.email, registeredUser.password);
        await expect(header.navMenu).toBeVisible();

        await productsPage.addFirstProductToCart();
        await cartPage.proceedToCheckout();
        await checkoutPage.fillBillingAddress();

        await test.step(`Pay with ${method}`, async () => {
          await enterPayment(checkoutPage);
          await checkoutPage.confirmButton.click();
        });

        await checkoutPage.expectConfirmation();
        await expect(page).toHaveURL(/\/checkout/);
      });
    }
  });

  /*
   * Priority: P2 | Type: Positive
   * Preconditions: A registered customer.
   * Steps: Buy one item, note the invoice number, open the invoice history.
   * Expected Result: The new invoice is listed.
   */
  test('E2E-12 [P2] Order appears in the invoice history @e2e @orders', async ({
    page,
    header,
    loginPage,
    productsPage,
    cartPage,
    checkoutPage,
    registeredUser,
  }) => {
    test.setTimeout(90_000);
    await loginPage.login(registeredUser.email, registeredUser.password);
    await expect(header.navMenu).toBeVisible();

    await productsPage.addFirstProductToCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillBillingAddress();
    await checkoutPage.selectPaymentMethod(PAYMENT_METHOD.cashOnDelivery);
    await checkoutPage.placeOrder();

    const invoiceNumber = await checkoutPage.readInvoiceNumber();
    await header.openInvoices();
    await expect(page.getByText(invoiceNumber).first()).toBeVisible();
  });

  /*
   * Priority: P3 | Type: Positive
   * Preconditions: A registered customer.
   * Steps: Add favourites, log out, log in, open favourites.
   * Expected Result: The favourites are still there.
   */
  test('E2E-13 [P3] Favourites are kept after logging out and in @e2e @favourites', async ({
    page,
    header,
    loginPage,
    productsPage,
    registeredUser,
  }) => {
    test.setTimeout(90_000);
    await loginPage.login(registeredUser.email, registeredUser.password);
    await expect(header.navMenu).toBeVisible();

    const favourites = await addItemsToFavourites({ productsPage }, 2);

    await header.signOut();
    await loginPage.goto();
    await loginPage.login(registeredUser.email, registeredUser.password);
    await expect(header.navMenu).toBeVisible();

    await verifyFavouritesListed({ page, header }, favourites);
  });

  /*
   * Priority: P3 | Type: Positive
   * Steps: Add three items, remove one.
   * Expected Result: Two items remain and the total equals the sum of their lines.
   */
  test('E2E-14 [P3] Removing an item updates the cart total @e2e @cart', async ({
    header,
    productsPage,
    cartPage,
  }) => {
    await addItemsToCart({ productsPage, header }, 3);
    await verifyCartContents(cartPage, 3);

    await cartPage.removeButton.first().click();

    await expect(cartPage.lineItems).toHaveCount(2);
    await expect(header.cartBadge).toHaveText('2');
    await expect.poll(() => cartPage.cartTotalValue()).toBeCloseTo(await cartPage.sumOfLinePrices(), 2);
  });
});
