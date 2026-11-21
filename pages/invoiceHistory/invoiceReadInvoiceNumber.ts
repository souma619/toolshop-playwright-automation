import type { CheckoutPage } from '../CheckoutPage';

export async function invoiceReadInvoiceNumber(checkoutPage: CheckoutPage): Promise<string> {
  return checkoutPage.readInvoiceNumber();
}
