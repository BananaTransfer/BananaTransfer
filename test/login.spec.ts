import { expect } from '@playwright/test';
import { test } from '@test/config';

test('login with valid credentials', async ({
  page,
  registerPage,
  loginPage,
  context,
  transferListPage,
}) => {
  const credentials = {
    username: 'test',
    password: 'test',
  };

  await registerPage.goto();
  await registerPage.register(credentials);
  await context.clearCookies();
  await loginPage.goto();
  await loginPage.login(credentials);
  await expect(page).toHaveURL(transferListPage.URL);
});
