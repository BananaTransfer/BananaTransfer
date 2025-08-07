import { test as base } from '@playwright/test';
import LoginPage from '@test/fixtures/LoginPage';
import RegisterPage from '@test/fixtures/RegisterPage';
import TransferListPage from '@test/fixtures/TransferListPage';

export const test = base.extend<{
  loginPage: LoginPage;
  registerPage: RegisterPage;
  transferListPage: TransferListPage;
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },
  transferListPage: async ({ page }, use) => {
    const transferListPage = new TransferListPage(page);
    await use(transferListPage);
  },
});
