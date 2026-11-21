import type { CheckoutPage } from '../CheckoutPage';

export async function invoiceFillBillingAddress(checkoutPage: CheckoutPage): Promise<void> {
  await checkoutPage.fillBillingAddress();
}
