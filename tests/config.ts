import { test as base } from '@playwright/test';
import LoginPage from './fixtures/LoginPage';
import RegisterPage from './fixtures/RegisterPage';

export const test = base.extend<{
  loginPage: LoginPage;
  registerPage: RegisterPage;
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },
});
