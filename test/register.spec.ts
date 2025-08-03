import { expect } from '@playwright/test';
import { test } from '@test/config';

test.beforeEach(async ({ registerPage }) => {
  await registerPage.goto();
});

test('registering with username and password works (twice same password and default email)', async ({
  page,
  registerPage,
  transferListPage,
}) => {
  await registerPage.register({
    username: 'registerTestUserA',
    password: 'password',
  });
  await expect(page).toHaveURL(transferListPage.URL);
});

test('registering with username, email and password works (twice same password)', async ({
  page,
  registerPage,
  transferListPage,
}) => {
  await registerPage.register({
    username: 'registerTestUserB',
    email: 'test@localhost',
    password: 'password',
  });
  await expect(page).toHaveURL(transferListPage.URL);
});

test('registering with two different password dont work', async ({
  page,
  registerPage,
}) => {
  await registerPage.register({
    username: 'registerTestUserC',
    password: 'password',
    confirmPassword: 'password2',
  });
  await expect(page).toHaveURL(registerPage.URL);
});
