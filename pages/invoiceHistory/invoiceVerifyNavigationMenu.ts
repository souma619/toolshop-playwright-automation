import { expect } from '@playwright/test';
import type { Header } from '../Header';

export async function invoiceVerifyNavigationMenu(header: Header): Promise<void> {
  await expect(header.navMenu).toBeVisible();
}
