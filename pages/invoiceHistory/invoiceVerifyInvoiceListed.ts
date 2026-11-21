import { expect, type Page } from '@playwright/test';

export async function invoiceVerifyInvoiceListed(this: Page, invoiceNumber: string): Promise<void> {
  await expect(this.getByText(invoiceNumber).first()).toBeVisible();
}
