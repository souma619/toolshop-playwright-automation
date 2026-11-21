import { Locator, Page, expect } from '@playwright/test';
import { parseMoney } from '../utils/money';

export class ProductsPage {
  readonly search: Locator;
  readonly searchSubmit: Locator;
  readonly searchReset: Locator;
  readonly searchCaption: Locator;
  readonly noResults: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly addToCartButton: Locator;
  readonly navCart: Locator;
  readonly sortSelect: Locator;
  readonly productPrices: Locator;
  readonly priceMinHandle: Locator;
  readonly priceMaxHandle: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;
  readonly activePage: Locator;
  readonly productTitle: Locator;
  readonly favouriteButton: Locator;

  constructor(private readonly page: Page) {
    this.search = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.searchReset = page.getByTestId('search-reset');
    this.searchCaption = page.getByTestId('search-caption'); // "Searched for: <query>"
    this.noResults = page.getByTestId('no-results');
    // Each product card is an <a data-test="product-<id>">
    this.productCards = page.locator('a.card[data-test^="product-"]');
    this.productNames = this.productCards.getByTestId('product-name');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.navCart = page.getByTestId('nav-cart');
    this.sortSelect = page.getByTestId('sort');
    this.productPrices = this.productCards.getByTestId('product-price');
    // The price filter is a two-handle slider (0-200); handles respond to the arrow keys
    this.priceMinHandle = page.locator('.ngx-slider-pointer-min');
    this.priceMaxHandle = page.locator('.ngx-slider-pointer-max');
    this.paginationPrev = page.getByTestId('pagination-prev');
    this.paginationNext = page.getByTestId('pagination-next');
    this.activePage = page.locator('ul.pagination li.page-item.active');
    this.productTitle = page.locator('h1[data-test="product-name"]');
    this.favouriteButton = page.getByTestId('add-to-favorites');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    // Wait for the catalog so later steps never act on an empty page
    await expect(this.productCards.first()).toBeVisible();
  }

  // Types a query and submits it without waiting for results
  async submitSearch(query: string): Promise<void> {
    await this.search.fill(query);
    await this.searchSubmit.click();
  }

  // Searches and waits until the page confirms it searched for this query,
  // so the next step never reads the previous (stale) result list.
  async searchFor(query: string): Promise<void> {
    await this.submitSearch(query);
    await expect(this.searchCaption).toContainText(query);
  }

  // Category filters are checkboxes labelled with the category name
  categoryCheckbox(name: string): Locator {
    return this.page.getByRole('checkbox', { name, exact: true });
  }

  // Opens the first product that is not marked "Out of stock"
  async openFirstProduct(): Promise<void> {
    const inStock = this.productCards.filter({ hasNot: this.page.getByText('Out of stock') });
    await inStock.first().click();
    await expect(this.addToCartButton).toBeVisible();
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
    // The cart icon appears once the item is stored, so the cart is ready before we navigate away
    await expect(this.navCart).toBeVisible();
  }

  async addFirstResultToCart(query = 'Pliers'): Promise<void> {
    await this.goto();
    await this.searchFor(query);
    await this.openFirstProduct();
    await this.addToCart();
  }

  // Quick cart seeding for tests where the cart is a precondition, not the subject
  async addFirstProductToCart(): Promise<void> {
    await this.goto();
    await this.openFirstProduct();
    await this.addToCart();
  }

  // ---------- Sorting, price range, pagination ----------
  async sortBy(value: string): Promise<void> {
    await this.sortSelect.selectOption(value);
  }

  async productNameList(): Promise<string[]> {
    return (await this.productNames.allInnerTexts()).map((name) => name.trim());
  }

  async productPriceValues(): Promise<number[]> {
    return (await this.productPrices.allInnerTexts()).map(parseMoney);
  }

  // Moves the upper price handle to the target value with the keyboard (one step per key press)
  async setMaxPrice(target: number): Promise<void> {
    const current = Number(await this.priceMaxHandle.getAttribute('aria-valuenow'));
    const key = target < current ? 'ArrowLeft' : 'ArrowRight';
    await this.priceMaxHandle.focus();
    for (let step = 0; step < Math.abs(target - current); step++) {
      await this.page.keyboard.press(key);
    }
  }

  paginationPage(number: number): Locator {
    return this.page.getByLabel(`Page-${number}`, { exact: true });
  }

  async goToPage(number: number): Promise<void> {
    await this.paginationPage(number).click();
    await expect(this.activePage).toHaveText(String(number));
  }

  // ---------- Product pages ----------
  // Opens the n-th in-stock product and returns its name
  async openProductAt(index: number): Promise<string> {
    const inStock = this.productCards.filter({ hasNot: this.page.getByText('Out of stock') });
    await inStock.nth(index).click();
    await expect(this.addToCartButton).toBeVisible();
    return (await this.productTitle.innerText()).trim();
  }

  // Waits for the favourites request so leaving the page cannot cancel it
  async addToFavourites(): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(
        (response) => response.url().includes('/favorites') && response.request().method() === 'POST',
      ),
      this.favouriteButton.click(),
    ]);
  }
}
