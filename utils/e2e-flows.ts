import { expect, test, type Page } from '@playwright/test';
import type { CartPage } from '../pages/CartPage';
import type { CheckoutPage } from '../pages/CheckoutPage';
import type { Header } from '../pages/Header';
import type { ProductsPage } from '../pages/ProductsPage';
import type { ApiHelper, ProductListBody } from './api-helper';
import { E2E } from '../data/test-data';

// Reusable e2e building blocks. Each one is a business-level step ("verify sorting",
// "add items to cart") so the specs read like the scenario they describe.

export interface Pages {
  page: Page;
  header: Header;
  productsPage: ProductsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  api: ApiHelper;
}

const namesFrom = async (response: { json: () => Promise<unknown> }): Promise<string[]> =>
  ((await response.json()) as ProductListBody).data.map((product) => product.name);

// ---------- Homepage ----------
export async function verifyHomepage({ page, header, productsPage }: Pick<Pages, 'page' | 'header' | 'productsPage'>) {
  await productsPage.goto();

  await expect(page).toHaveTitle(/Toolshop/i);
  await expect(header.navHome).toBeVisible();
  await expect(header.navCategories).toBeVisible();
  await expect(header.navContact).toBeVisible();

  // A full first page of products, each with a name and a price
  await expect(productsPage.productCards).toHaveCount(9);
  await expect(productsPage.productNames.first()).not.toBeEmpty();
  for (const price of await productsPage.productPrices.allInnerTexts()) {
    expect(price).toMatch(/^\$\d/);
  }

  // Controls the shopper relies on
  await expect(productsPage.sortSelect).toBeVisible();
  await expect(productsPage.search).toBeVisible();
  await expect(productsPage.priceMaxHandle).toBeVisible();
  await expect(productsPage.categoryCheckbox('Hammer')).toBeVisible();
  await expect(productsPage.paginationPage(2)).toBeVisible();
}

// ---------- Sorting ----------
export async function verifyPriceSorting(productsPage: ProductsPage, sortValue: string) {
  await productsPage.goto();
  await productsPage.sortBy(sortValue);

  const ascending = sortValue.endsWith('asc');
  // Poll: the list re-renders after the sort request returns
  await expect
    .poll(async () => {
      const prices = await productsPage.productPriceValues();
      const expected = [...prices].sort((a, b) => (ascending ? a - b : b - a));
      return prices.length > 1 && JSON.stringify(prices) === JSON.stringify(expected);
    })
    .toBe(true);
}

// ---------- Price range ----------
export async function verifyPriceRange({ productsPage, api }: Pick<Pages, 'productsPage' | 'api'>, maxPrice: number) {
  await productsPage.goto();
  await productsPage.setMaxPrice(maxPrice);

  // The API tells us which products fall inside the range, in the same default order
  const response = await api.getProducts({ between: `price,1,${maxPrice}`, page: 1 });
  expect(response.status()).toBe(200);
  const expected = await namesFrom(response);
  expect(expected.length).toBeGreaterThan(0);

  await expect.poll(() => productsPage.productNameList()).toEqual(expected);
  expect((await productsPage.productPriceValues()).every((price) => price <= maxPrice)).toBe(true);
}

// ---------- Search ----------
export async function verifySearch({ productsPage, api }: Pick<Pages, 'productsPage' | 'api'>, term: string) {
  await productsPage.goto();
  await productsPage.searchFor(term);

  const expected = await namesFrom(await api.searchProducts(term));
  expect(expected.length).toBeGreaterThan(0);
  await expect.poll(() => productsPage.productNameList()).toEqual(expected);
}

// ---------- Brand and category checkboxes ----------
export async function verifyCheckboxFilters({ productsPage, api }: Pick<Pages, 'productsPage' | 'api'>) {
  await productsPage.goto();

  const brand = productsPage.categoryCheckbox(E2E.brand); // brands are checkboxes too
  const category = productsPage.categoryCheckbox(E2E.category);
  const idOf = async (box: typeof brand, prefix: string) =>
    (await box.getAttribute('data-test'))?.replace(`${prefix}-`, '') ?? '';
  const brandId = await idOf(brand, 'brand');
  const categoryId = await idOf(category, 'category');
  expect(brandId && categoryId, 'checkboxes should expose their ids').toBeTruthy();

  await test.step('Brand only', async () => {
    await brand.check();
    const expected = await namesFrom(await api.getProducts({ by_brand: brandId, page: 1 }));
    await expect.poll(() => productsPage.productNameList()).toEqual(expected);
  });

  await test.step('Brand and category together', async () => {
    await category.check();
    const expected = await namesFrom(await api.getProducts({ by_brand: brandId, by_category: categoryId, page: 1 }));
    await expect.poll(() => productsPage.productNameList()).toEqual(expected);
  });

  await test.step('Category only', async () => {
    await brand.uncheck();
    const expected = await namesFrom(await api.getProducts({ by_category: categoryId, page: 1 }));
    await expect.poll(() => productsPage.productNameList()).toEqual(expected);
  });
}

// ---------- Pagination ----------
export async function verifyPagination({ page, productsPage }: Pick<Pages, 'page' | 'productsPage'>) {
  await productsPage.goto();
  const pageOne = await productsPage.productNameList();

  await expect(productsPage.activePage).toHaveText('1');
  // There is nothing before the first page
  await expect(page.locator('li.page-item').filter({ has: productsPage.paginationPrev })).toHaveClass(/disabled/);

  await productsPage.goToPage(2);
  await expect.poll(() => productsPage.productNameList()).not.toEqual(pageOne);
  const pageTwo = await productsPage.productNameList();
  expect(pageTwo.length).toBeGreaterThan(0);
  expect(pageTwo.filter((name) => pageOne.includes(name))).toHaveLength(0);

  await productsPage.goToPage(3);
  await expect.poll(() => productsPage.productNameList()).not.toEqual(pageTwo);

  // Next and Previous move one page at a time
  await productsPage.paginationNext.click();
  await expect(productsPage.activePage).toHaveText('4');
  await productsPage.paginationPrev.click();
  await expect(productsPage.activePage).toHaveText('3');
}

// ---------- Cart ----------
export async function addItemsToCart(
  { productsPage, header }: Pick<Pages, 'productsPage' | 'header'>,
  count: number,
): Promise<string[]> {
  const names: string[] = [];
  for (let index = 0; index < count; index++) {
    await productsPage.goto();
    names.push(await productsPage.openProductAt(index));
    await productsPage.addToCart();
    // Wait until the badge shows the new count before moving on
    await expect(header.cartBadge).toHaveText(String(index + 1));
  }
  return names;
}

export async function verifyCartContents(cartPage: CartPage, count: number) {
  await cartPage.goto();
  await expect(cartPage.lineItems).toHaveCount(count);
  await expect.poll(() => cartPage.cartTotalValue()).toBeCloseTo(await cartPage.sumOfLinePrices(), 2);
}

export async function updateQuantityInCart(cartPage: CartPage, header: Header, quantity: number) {
  const unitPrice = await cartPage.unitPriceValue(0);
  await cartPage.setQuantity(quantity, 0);

  await expect.poll(() => cartPage.linePriceValue(0)).toBeCloseTo(unitPrice * quantity, 2);
  // The cart total is the sum of the lines, so it must follow
  await expect.poll(async () => (await cartPage.cartTotalValue()) - (await cartPage.sumOfLinePrices())).toBeCloseTo(0, 2);
  await expect(cartPage.quantity.nth(0)).toHaveValue(String(quantity));
  await expect(header.cartBadge).not.toHaveText('0');
}

// ---------- Favourites ----------
export async function addItemsToFavourites(
  { productsPage }: Pick<Pages, 'productsPage'>,
  count: number,
): Promise<string[]> {
  const names: string[] = [];
  for (let index = 0; index < count; index++) {
    await productsPage.goto();
    names.push(await productsPage.openProductAt(index));
    await productsPage.addToFavourites();
  }
  return names;
}

export async function verifyFavouritesListed({ page, header }: Pick<Pages, 'page' | 'header'>, names: string[]) {
  await header.openFavourites();
  for (const name of names) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
}
