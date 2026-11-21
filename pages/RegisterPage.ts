import { Locator, Page } from '@playwright/test';

export class RegisterPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly dob: Locator;
  readonly address: Locator;
  readonly postcode: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly country: Locator;
  readonly phone: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly registerButton: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByLabel(/first name/i);
    this.lastName = page.getByLabel(/last name/i);
    this.dob = page.getByLabel(/date of birth/i);
    this.address = page.getByLabel(/street|address/i);
    this.postcode = page.getByLabel(/postal|postcode/i);
    this.city = page.getByLabel(/city/i);
    this.state = page.getByLabel(/state/i);
    this.country = page.getByLabel(/country/i);
    this.phone = page.getByLabel(/phone/i);
    this.email = page.getByLabel(/email/i);
    this.password = page.getByLabel(/^password/i);
    this.registerButton = page.getByRole('button', { name: /register/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/register');
  }
}
