import { test as base } from '@playwright/test';
import LoginPage from '@test/fixtures/LoginPage';
import RegisterPage from '@test/fixtures/RegisterPage';
import TransferListPage from '@test/fixtures/TransferListPage';
import SetKeysPage from '@test/fixtures/SetKeysPage';
import SettingsPage from '@test/fixtures/SettingsPage';

export const test = base.extend<{
  loginPage: LoginPage;
  registerPage: RegisterPage;
  transferListPage: TransferListPage;
  setKeysPage: SetKeysPage;
  settingsPage: SettingsPage;
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
  setKeysPage: async ({ page }, use) => {
    const setKeysPage = new SetKeysPage(page);
    await use(setKeysPage);
  },
  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    await use(settingsPage);
  },
});
