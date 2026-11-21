import type { CheckoutPage } from '../CheckoutPage';

export async function invoiceReadInvoiceNumber(this: CheckoutPage): Promise<string> {
  const text = await this.confirmButton.page().getByText(/INV-\d+/).first().innerText();
  const match = text.match(/INV-\d+/);
  if (!match) {
    throw new Error(`No invoice number found in "${text}"`);
  }
  return match[0];
}
