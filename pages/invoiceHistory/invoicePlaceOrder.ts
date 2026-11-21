import type { CheckoutPage } from '../CheckoutPage';

export async function invoicePlaceOrder(checkoutPage: CheckoutPage): Promise<void> {
  await checkoutPage.placeOrder();
}
