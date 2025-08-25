import { expect } from '@playwright/test';
import { test } from '@test/config';
import { faker } from '@faker-js/faker';

test('login with valid credentials', async ({
  page,
  registerPage,
  loginPage,
  context,
  setKeysPage,
}) => {
  const credentials = {
    username: faker.person.firstName(),
    password: faker.internet.password({ length: 13 }),
  };

  await registerPage.goto();
  await registerPage.register(credentials);
  await context.clearCookies();
  await loginPage.goto();
  await loginPage.login(credentials);
  await expect(page).toHaveURL(setKeysPage.URL);
});

test('user should be redirected to app if logged in', async ({
  registerPage,
  loginPage,
  page,
  setKeysPage,
}) => {
  const credentials = {
    username: faker.person.firstName(),
    password: faker.internet.password({ length: 13 }),
  };

  await registerPage.goto();
  await registerPage.register(credentials);
  await expect(page).toHaveURL(setKeysPage.URL);
  await loginPage.goto();
  await expect(page).toHaveURL(setKeysPage.URL);
});
