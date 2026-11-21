import type { Header } from '../Header';

export async function invoiceOpenInvoices(header: Header): Promise<void> {
  await header.openInvoices();
}
