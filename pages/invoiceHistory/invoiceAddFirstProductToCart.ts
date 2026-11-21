import type { ProductsPage } from '../ProductsPage';

export async function invoiceAddFirstProductToCart(productsPage: ProductsPage): Promise<void> {
  await productsPage.addFirstProductToCart();
}
