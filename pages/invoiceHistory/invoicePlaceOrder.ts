import type { CheckoutPage } from '../CheckoutPage';
import { expect } from '@playwright/test';

export async function invoicePlaceOrder(this: CheckoutPage): Promise<void> {
  await this.confirmButton.click();
  await expect(this.successMessage.first()).toBeVisible();
  const invoice = this.confirmButton.page().getByText(/INV-\d+/).first();
  await expect(async () => {
    if (!(await invoice.isVisible())) {
      await this.confirmButton.click();
    }
    await expect(invoice).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 20_000 });
}
