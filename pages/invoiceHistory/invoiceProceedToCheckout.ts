import type { CartPage } from '../CartPage';
import { expect } from '@playwright/test';

export async function invoiceProceedToCheckout(this: CartPage): Promise<void> {
  await this.cartLink.click();
  await this.proceedToSignIn.click();
  await expect(this.proceedToBilling.or(this.guestSubmit)).toBeVisible();
  if (await this.proceedToBilling.isVisible()) {
    await this.proceedToBilling.click();
  }
}
