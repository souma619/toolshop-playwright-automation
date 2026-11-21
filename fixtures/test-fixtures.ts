import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { Header } from '../pages/Header';
import { ApiHelper } from '../utils/api-helper';
import { registerUser } from '../utils/auth';
import { VALID_PASSWORD, uniqueEmail } from '../data/test-data';

export type RegisteredUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type ToolshopFixtures = {
  header: Header;
  registeredUser: RegisteredUser;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  productsPage: ProductsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  api: ApiHelper;
};

export type LoggedInFixtures = {
  loggedInPage: LoginPage;
};

export const test = base.extend<ToolshopFixtures & LoggedInFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));

    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  header: async ({ page }, use) => use(new Header(page)),
  // A brand-new customer, registered through the UI. Leaves the browser on the login page.
  registeredUser: async ({ page }, use) => {
    const user: RegisteredUser = {
      email: uniqueEmail('qa.customer'),
      password: VALID_PASSWORD,
      firstName: 'Casey',
      lastName: 'Customer',
    };
    await registerUser(page, user);
    await expect(page).toHaveURL(/\/auth\/login/);
    await use(user);
  },
  productsPage: async ({ page }, use) => use(new ProductsPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  loggedInPage: async ({ loginPage, page }, use) => {
    await loginPage.goto();
    const username = process.env.TOOLSHOP_USERNAME;
    const password = process.env.TOOLSHOP_PASSWORD;
    if (!username || !password) {
      throw new Error('TOOLSHOP_USERNAME and TOOLSHOP_PASSWORD must be set in .env');
    }
    await loginPage.login(username, password);
    await expect(page).not.toHaveURL(/\/auth\/login/);

    await use(loginPage);

    // Test completion cleanup: explicitly log out so no authenticated state
    // carries into the next test. Clear browser state if logout UI is unavailable.
    try {
      await loginPage.logout();
    } catch {
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await loginPage.goto();
    }
  },
  api: async ({ request }, use) => use(new ApiHelper(request)),
});

export { expect } from '@playwright/test';
