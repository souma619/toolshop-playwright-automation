import { test, expect } from '../../fixtures/test-fixtures';
import { PAYMENT_METHOD } from '../../data/test-data';

test.describe('E2E-12: invoice history', () => {
  test('Order appears in the invoice history @e2e @orders', async ({
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
});
