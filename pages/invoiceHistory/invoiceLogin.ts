import type { LoginPage } from '../LoginPage';
import type { RegisteredUser } from '../../fixtures/test-fixtures';

export async function invoiceLogin(loginPage: LoginPage, registeredUser: RegisteredUser): Promise<void> {
  await loginPage.login(registeredUser.email, registeredUser.password);
}
