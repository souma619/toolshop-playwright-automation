import type { Page } from '@playwright/test';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Fills and submits the registration form. Shared by the auth specs, the e2e specs and the fixtures.
export async function registerUser(page: Page, data: RegistrationData): Promise<void> {
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
