import type { ProductsPage } from '../ProductsPage';

export async function invoiceAddFirstProductToCart(this: ProductsPage): Promise<void> {
  await this.goto();
  await this.openFirstProduct();
  await this.addToCart();
}
