import type { CheckoutPage } from '../CheckoutPage';
import { expect, type Locator } from '@playwright/test';
import { BILLING_ADDRESS, type BillingAddress } from '../../data/test-data';

async function invoiceSelectByText(select: Locator, text: string | RegExp): Promise<void> {
  const value = await select.locator('option').filter({ hasText: text }).first().getAttribute('value');
  if (value === null) {
    throw new Error(`No option matching ${String(text)} found`);
  }
  await select.selectOption(value);
}

export async function invoiceFillBillingAddress(
  this: CheckoutPage,
  address: BillingAddress = BILLING_ADDRESS,
): Promise<void> {
  await invoiceSelectByText(this.country, address.country);
  await this.postalCode.fill(address.postalCode);
  await this.houseNumber.fill(address.houseNumber);
  await this.street.fill(address.street);
  await this.city.fill(address.city);
  await this.state.fill(address.state);
  await this.proceedToPayment.click();
  await expect(this.paymentMethod).toBeVisible();
}
