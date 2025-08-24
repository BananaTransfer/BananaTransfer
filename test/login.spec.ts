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

test('complete registration and set keys flow', async ({
  page,
  registerPage,
  setKeysPage,
}) => {
  const credentials = {
    username: faker.person.firstName(),
    password: faker.internet.password({ length: 13 }),
  };

  // Register
  await registerPage.goto();
  await registerPage.register(credentials);

  // After registration, should be on set-keys page
  await expect(page).toHaveURL(setKeysPage.URL);

  await setKeysPage.generateKeyPair();
  await setKeysPage.generateMasterPassword();

  // Encrypt and save keys (this triggers two modals)
  // Get master password from the field, use user password from registration
  const masterPassword = await setKeysPage.masterPasswordField.inputValue();
  await setKeysPage.encryptAndSaveKeys({
    masterPassword,
    userPassword: credentials.password,
  });

  // After saving, should be redirected to user settings with success query
  await expect(page).toHaveURL(/\/user\?setKeysSuccess=true/);
});

test('registration, set keys, go to transfer list, and logout', async ({
  page,
  registerPage,
  loginPage,
  setKeysPage,
  transferListPage,
  context,
}) => {
  const credentials = {
    username: faker.person.firstName(),
    password: faker.internet.password({ length: 13 }),
  };

  // Registration
  await registerPage.goto();
  await registerPage.register(credentials);

  // Set Keys flow
  await expect(page).toHaveURL(setKeysPage.URL);
  await setKeysPage.generateKeyPair();
  await setKeysPage.generateMasterPassword();
  const masterPassword = await setKeysPage.masterPasswordField.inputValue();
  await setKeysPage.encryptAndSaveKeys({
    masterPassword,
    userPassword: credentials.password,
  });

  // Arrive on user settings page, now navigate to transfer list
  await transferListPage.goto();
  await expect(page).toHaveURL(transferListPage.URL);

  // Logout
  await transferListPage.logout();
  await expect(page).toHaveURL(loginPage.URL, { timeout: 5000 });
  await expect(page.locator('#username')).toBeVisible({ timeout: 5000 });

  // Assert JWT/session cookie is cleared
  const cookies = await context.cookies();
  expect(cookies.some((cookie) => cookie.name === 'jwt')).toBeFalsy();
});
