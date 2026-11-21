import { expect, type Page } from '@playwright/test';

export async function invoiceVerifyInvoiceListed(page: Page, invoiceNumber: string): Promise<void> {
  await expect(page.getByText(invoiceNumber).first()).toBeVisible();
}
