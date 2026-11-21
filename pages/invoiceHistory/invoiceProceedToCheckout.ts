import type { CartPage } from '../CartPage';

export async function invoiceProceedToCheckout(cartPage: CartPage): Promise<void> {
  await cartPage.proceedToCheckout();
}
