import type { CheckoutPage } from '../CheckoutPage';

export async function invoiceSelectPaymentMethod(checkoutPage: CheckoutPage, method: RegExp): Promise<void> {
  await checkoutPage.selectPaymentMethod(method);
}
