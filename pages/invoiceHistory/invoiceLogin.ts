import type { LoginPage } from '../LoginPage';

export async function invoiceLogin(this: LoginPage, username: string, password: string): Promise<void> {
  await this.email.fill(username);
  await this.password.fill(password);
  await this.loginButton.click();
}
