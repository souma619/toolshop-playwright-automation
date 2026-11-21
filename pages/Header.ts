import { Locator, Page, expect } from '@playwright/test';

// The site header: navigation, account menu and cart badge
export class Header {
  readonly navHome: Locator;
  readonly navCategories: Locator;
  readonly navContact: Locator;
  readonly navSignIn: Locator;
  readonly navMenu: Locator;
  readonly navSignOut: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    this.navHome = page.getByTestId('nav-home');
    this.navCategories = page.getByTestId('nav-categories');
    this.navContact = page.getByTestId('nav-contact');
    this.navSignIn = page.getByTestId('nav-sign-in');
    this.navMenu = page.getByTestId('nav-menu'); // the logged-in user's menu
    this.navSignOut = page.getByTestId('nav-sign-out');
    this.cartLink = page.getByTestId('nav-cart');
    this.cartBadge = page.getByTestId('cart-quantity');
  }

  async signOut(): Promise<void> {
    await this.navMenu.click();
    await this.navSignOut.click();
    // A real sign out brings the "Sign in" link back
    await expect(this.navSignIn).toBeVisible();
  }

  async openFavourites(): Promise<void> {
    await this.page.goto('/account/favorites');
  }

  async openInvoices(): Promise<void> {
    await this.page.goto('/account/invoices');
  }
}
