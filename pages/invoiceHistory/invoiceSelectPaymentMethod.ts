import type { CheckoutPage } from '../CheckoutPage';

export async function invoiceSelectPaymentMethod(this: CheckoutPage, method: RegExp): Promise<void> {
  const value = await this.paymentMethod.locator('option').filter({ hasText: method }).first().getAttribute('value');
  if (value === null) {
    throw new Error(`No option matching ${String(method)} found`);
  }
  await this.paymentMethod.selectOption(value);
}
