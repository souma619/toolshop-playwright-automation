import type { Header } from '../Header';

export async function invoiceOpenInvoices(this: Header): Promise<void> {
  await this.navMenu.page().goto('/account/invoices');
}
