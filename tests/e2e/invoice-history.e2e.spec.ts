import { test } from '../../fixtures/test-fixtures';
import { PAYMENT_METHOD } from '../../data/test-data';
import { invoiceAddFirstProductToCart } from '../../pages/invoiceHistory/invoiceAddFirstProductToCart';
import { invoiceFillBillingAddress } from '../../pages/invoiceHistory/invoiceFillBillingAddress';
import { invoiceLogin } from '../../pages/invoiceHistory/invoiceLogin';
import { invoiceOpenInvoices } from '../../pages/invoiceHistory/invoiceOpenInvoices';
import { invoicePlaceOrder } from '../../pages/invoiceHistory/invoicePlaceOrder';
import { invoiceProceedToCheckout } from '../../pages/invoiceHistory/invoiceProceedToCheckout';
import { invoiceReadInvoiceNumber } from '../../pages/invoiceHistory/invoiceReadInvoiceNumber';
import { invoiceSelectPaymentMethod } from '../../pages/invoiceHistory/invoiceSelectPaymentMethod';
import { invoiceVerifyInvoiceListed } from '../../pages/invoiceHistory/invoiceVerifyInvoiceListed';
import { invoiceVerifyNavigationMenu } from '../../pages/invoiceHistory/invoiceVerifyNavigationMenu';

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
    await invoiceLogin(loginPage, registeredUser);
    await invoiceVerifyNavigationMenu(header);

    await invoiceAddFirstProductToCart(productsPage);
    await invoiceProceedToCheckout(cartPage);
    await invoiceFillBillingAddress(checkoutPage);
    await invoiceSelectPaymentMethod(checkoutPage, PAYMENT_METHOD.cashOnDelivery);
    await invoicePlaceOrder(checkoutPage);

    const invoiceNumber = await invoiceReadInvoiceNumber(checkoutPage);
    await invoiceOpenInvoices(header);
    await invoiceVerifyInvoiceListed(page, invoiceNumber);
  });
});
