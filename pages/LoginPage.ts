import { Locator, Page, expect } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;
  readonly logoutLink: Locator;
  readonly signInLink: Locator;

  constructor(private readonly page: Page) {
    this.email = page.locator('[data-test="email"]').or(page.getByLabel('Email address'));
    this.password = page.locator('[data-test="password"]').or(page.getByLabel('Password', { exact: true }));
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
    this.errorAlert = page.getByRole('alert').or(page.locator('.alert-danger')).or(page.locator('[role="alert"]'));
    this.signInLink = page.getByRole('link', { name: 'Sign in', exact: true });
    this.logoutLink = page.locator('[data-test="nav-sign-out"]')
      .or(page.getByRole('link', { name: /sign out|logout/i }))
      .or(page.getByRole('button', { name: /sign out|logout/i }));
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.email.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectInvalidCredentialsError(): Promise<void> {
    await expect(this.errorAlert).toHaveText(/Invalid email or password/i);
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
    await expect(this.signInLink).toBeVisible();
  }
}
