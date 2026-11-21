import { expect } from '@playwright/test';
import type { Header } from '../Header';

export async function invoiceVerifyNavigationMenu(this: Header): Promise<void> {
  await expect(this.navMenu).toBeVisible();
}
