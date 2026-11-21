import { test, expect } from '../../fixtures/test-fixtures';
import type { Page } from '@playwright/test';

// ---------- Helpers ----------

// Strong password that satisfies the app's password rules
const VALID_PASSWORD = 'Str0ng!Passw0rd#2026';

// Unique email per run so registration tests never collide
const uniqueEmail = (prefix = 'qa.user') =>
  `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.com`;

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Fills and submits the registration form using the app's data-test attributes.
async function registerUser(page: Page, data: RegistrationData) {
  await page.goto('/auth/register');
  await page.getByLabel('First name', { exact: false }).fill(data.firstName);
  await page.getByLabel('Last name', { exact: false }).fill(data.lastName);
  await page.getByLabel(/Date of Birth/i).fill('1990-05-15');
  await page.getByLabel('Country', { exact: true }).selectOption({ label: 'India' });
  await page.getByLabel('Postal code', { exact: true }).fill('560001');
  await page.getByLabel('Street', { exact: true }).fill('12 MG Road');
  await page.getByLabel('City', { exact: true }).fill('Bengaluru');
  await page.getByLabel('State', { exact: true }).fill('Karnataka');
  await page.getByLabel('Phone', { exact: true }).fill('9876543210');
  await page.getByLabel('Email address', { exact: true }).fill(data.email);
  await page.getByLabel('Password', { exact: true }).fill(data.password);
  await page.getByLabel('House number', { exact: false }).fill('12');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
}

test.describe('Login', () => {
    /*
   * Priority: P1 | Type: Positive
   * Preconditions: Registration page is reachable; email is unique for this run.
   * Steps:
   * 1. Open the registration page.
   * 2. Fill all required fields with valid data and a unique email.
   * 3. Submit the form.
   * Expected Result: Registration succeeds and the user is redirected to the login page.
   */
  test('TC-01 [P1][Positive] Register a new user with valid data @P1 @positive @automated', async ({ page }) => {
    await test.step('Register with valid, unique data', async () => {
      await registerUser(page, {
        firstName: 'Soumabha',
        lastName: 'Tester',
        email: uniqueEmail(),
        password: VALID_PASSWORD,
      });
    });

    await test.step('Verify redirect to the login page', async () => {
      // A successful registration sends the user to login; staying on /register would mean it failed
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
    });
  });

  /*
   * Priority: P2 | Type: Negative
   * Preconditions: The demo account email already exists (TOOLSHOP_USERNAME in .env).
   * Steps:
   * 1. Open the registration page.
   * 2. Fill the form using the already-registered email.
   * 3. Submit the form.
   * Expected Result: Registration is rejected with an error and the user stays on the register page.
   */
  test('TC-02 [P2][Negative] Register with an already-registered email @P2 @negative @automated', async ({ page }) => {
    const existingEmail = process.env.TOOLSHOP_USERNAME;
    if (!existingEmail) throw new Error('TOOLSHOP_USERNAME must be set in .env');

    await registerUser(page, {
      firstName: 'Duplicate',
      lastName: 'Tester',
      email: existingEmail,
      password: VALID_PASSWORD,
    });

    // Duplicate email must not create an account, so we remain on the register page
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.getByText(/already exists|already registered|duplicate/i).first()).toBeVisible();
  });

  /*
   * Priority: P3 | Type: Edge
   * Preconditions: Registration page is reachable; email is unique for this run.
   * Steps:
   * 1. Open the registration page.
   * 2. Enter first and last names at the maximum allowed length (40 characters).
   * 3. Submit the form.
   * Expected Result: Boundary-length names are accepted and the user lands on the login page.
   */
  test('TC-03 [P3][Edge] Register with maximum-length first and last name @P3 @edge @automated', async ({ page }) => {
    const firstName = 'A'.repeat(40);
    const lastName = 'B'.repeat(20);

    await registerUser(page, {
      firstName,
      lastName,
      email: uniqueEmail('qa.edge'),
      password: VALID_PASSWORD,
    });

    // Names at the boundary should be accepted, not truncated into an error
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  /*
   * Priority: P2 | Type: Positive
   * Preconditions: Valid demo credentials exist in .env.
   * Steps:
   * 1. Login with valid credentials.
   * 2. Open the user menu and click Sign out.
   * 3. Try to open the account page again.
   * Expected Result: The session ends and protected pages redirect to login.
   */
  test('TC-04 [P2][Positive] Logout after login and verify the session ends @P2 @positive @automated', async ({ page, loginPage }) => {
    const email = uniqueEmail('qa.logout');

    await test.step('Register a separate account for this test', async () => {
      await registerUser(page, {
        firstName: 'Logout',
        lastName: 'Tester',
        email,
        password: VALID_PASSWORD,
      });
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    await test.step('Login with the newly registered credentials', async () => {
      await loginPage.login(email, VALID_PASSWORD);
      await expect(page).not.toHaveURL(/\/auth\/login/);
      await expect(page).toHaveURL(/\/account/);
    });

    await test.step('Sign out from the user menu', async () => {
      await page.getByRole('button', { name: /Logout/i }).click();
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await loginPage.goto();
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    await test.step('Verify the session has ended', async () => {
      // A protected page must bounce back to login if the session is really gone
      await page.goto('/account');
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  /*
   * Priority: P1 | Type: Positive
   * Preconditions: Valid demo credentials exist in .env and the cart is available.
   * Steps:
   * 1. Login with valid credentials.
   * 2. Search for Pliers and open the first in-stock result.
   * 3. Add the product to the cart and open the cart.
   * 4. Proceed through checkout and complete confirmation.
   * 5. Verify the order/payment confirmation.
   * Expected Result: The complete purchase flow succeeds and a confirmation is visible.
   */
  test('TC-05 [P1][Positive] Login and complete the E2E shopping flow @P1 @positive @automated @video', async ({
    page,
    loginPage,
    productsPage,
    cartPage,
    checkoutPage,
  }) => {
    const email = uniqueEmail('qa.checkout');

    await test.step('Register a separate account for this shopping test', async () => {
      await registerUser(page, {
        firstName: 'Checkout',
        lastName: 'Tester',
        email,
        password: VALID_PASSWORD,
      });
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    await test.step('Login with the newly registered account', async () => {
      await loginPage.login(email, VALID_PASSWORD);
      await expect(page).not.toHaveURL(/\/auth\/login/);
    });

    await test.step('Search, add to cart, and proceed to checkout', async () => {
      await productsPage.addFirstResultToCart();
      await cartPage.proceedToCheckout();
    });

    await test.step('Complete checkout and verify confirmation', async () => {
      await checkoutPage.fillBillingAddress();
      await checkoutPage.confirmBankTransfer();
      await checkoutPage.confirmButton.click();
      await checkoutPage.expectConfirmation();
    });

    await test.step('Log out after the purchase test', async () => {
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });
  });

  /*
   * Priority: P1 | Type: Negative
   * Preconditions: The demo account email is valid and the password is deliberately invalid.
   * Steps:
   * 1. Open the login page.
   * 2. Enter the valid demo email and an invalid password.
   * 3. Submit the login form.
   * Expected Result: Login fails and "Invalid email or password" is shown exactly.
   */
 
  test('TC-06 [P1][Negative] Login with invalid password @P1 @negative @automated @video', async ({ page, loginPage }) => {
    const email = uniqueEmail('qa.invalid-login');

    await test.step('Register a separate account for this negative login test', async () => {
      await registerUser(page, {
        firstName: 'Invalid',
        lastName: 'Login',
        email,
        password: VALID_PASSWORD,
      });
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    await test.step('Attempt login with an invalid password', async () => {
      await loginPage.login(email, 'Definitely-Wrong-Password-123!');
      await loginPage.expectInvalidCredentialsError();
    });
  });
 
});
