import { Locator, Page, expect } from '@playwright/test';
import { parseMoney } from '../utils/money';

export class CartPage {
  readonly cartLink: Locator;
  readonly headerQuantity: Locator;
  readonly lineItems: Locator;
  readonly quantity: Locator;
  readonly unitPrice: Locator;
  readonly linePrice: Locator;
  readonly cartTotal: Locator;
  readonly removeButton: Locator;
  readonly emptyMessage: Locator;
  readonly proceedToSignIn: Locator;
  readonly proceedToBilling: Locator;
  readonly guestSubmit: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByTestId('nav-cart');
    this.headerQuantity = page.getByTestId('cart-quantity');
    this.lineItems = page.locator('tbody tr');
    this.quantity = page.getByTestId('product-quantity');
    this.unitPrice = page.getByTestId('product-price');
    this.linePrice = page.getByTestId('line-price');
    this.cartTotal = page.getByTestId('cart-total');
    this.removeButton = page.locator('tbody tr a.btn-danger');
    this.emptyMessage = page.getByText('The cart is empty. Nothing to display.');
    this.proceedToSignIn = page.getByTestId('proceed-1'); // cart step -> sign-in step
    this.proceedToBilling = page.getByTestId('proceed-2'); // shown only to logged-in users
    this.guestSubmit = page.getByTestId('guest-submit'); // shown only to anonymous users
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  // Changes the quantity like a user: type a value, then leave the field so the app recalculates
  // `row` is the zero-based line in the cart (0 = first item)
  async setQuantity(value: number, row = 0): Promise<void> {
    await this.quantity.nth(row).fill(String(value));
    await this.quantity.nth(row).press('Tab');
  }

  async unitPriceValue(row = 0): Promise<number> {
    return parseMoney(await this.unitPrice.nth(row).innerText());
  }

  async linePriceValue(row = 0): Promise<number> {
    return parseMoney(await this.linePrice.nth(row).innerText());
  }

  // Sum of all line prices, to compare against the displayed cart total
  async sumOfLinePrices(): Promise<number> {
    const prices = (await this.linePrice.allInnerTexts()).map(parseMoney);
    return prices.reduce((sum, price) => sum + price, 0);
  }

  async cartTotalValue(): Promise<number> {
    return parseMoney(await this.cartTotal.innerText());
  }

  // Opens the cart and moves past the sign-in step.
  // Logged-in users get an extra "you are already logged in" step with its own button.
  async proceedToCheckout(): Promise<void> {
    await this.cartLink.click();
    await this.proceedToSignIn.click();
    await expect(this.proceedToBilling.or(this.guestSubmit)).toBeVisible();
    if (await this.proceedToBilling.isVisible()) {
      await this.proceedToBilling.click();
    }
  }
}
