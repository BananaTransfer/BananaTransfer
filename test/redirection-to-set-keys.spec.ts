import { expect } from '@playwright/test';
import { test } from '@test/config';
import { faker } from '@faker-js/faker';

test('redirect non-keyed user to set keys when accessing transfer list', async ({
  page,
  registerPage,
  transferListPage,
  setKeysPage,
}) => {
  // Go to register page and fill out form
  const credentials = {
    username:
      faker.person.firstName().toLowerCase() +
      faker.number.int({ min: 10000, max: 99999 }),
    password: faker.internet.password({ length: 13 }),
  };
  await registerPage.goto();
  await registerPage.register(credentials);

  // After registration, should be redirected to set keys page
  await expect(page).toHaveURL(setKeysPage.URL);

  // Simulate manual navigation to transfer list (without setting keys)
  await transferListPage.goto();

  // User should be redirected back to set keys page
  await expect(page).toHaveURL(setKeysPage.URL);

  // Extra: Make sure key setup UI is visible
  await expect(page.locator('#generateKeyPairBtn')).toBeVisible();
  await expect(page.locator('#generateMasterPasswordBtn')).toBeVisible();
});
