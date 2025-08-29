import { expect } from '@playwright/test';
import { test, waitPageReady } from '@test/config';
import { faker } from '@faker-js/faker';
import fs from 'fs';

const DOMAIN = process.env.DOMAIN || 'domain.com';
const TEST_FILE_PATH = './README.md';
if (!fs.existsSync(TEST_FILE_PATH)) {
  fs.writeFileSync(TEST_FILE_PATH, 'This is a test file for transfer.');
}

const credentials = {
  username:
    faker.person.firstName().toLowerCase() +
    faker.number.int({ min: 10000, max: 99999 }),
  password: faker.internet.password({ length: 13 }),
};

test('full transfer flow: register, set keys, send to self, accept, download, log out', async ({
  page,
  registerPage,
  loginPage,
  setKeysPage,
  transferListPage,
  newTransferPage,
  context,
}) => {
  // Go to register page and fill out form
  await registerPage.goto();
  await registerPage.register(credentials);

  // Registration succeeded, redirected to set keys
  await expect(page).toHaveURL(setKeysPage.URL);
  await waitPageReady(page);
  await setKeysPage.generateKeyPair();
  await setKeysPage.generateMasterPassword();

  // Encrypt and save keys (this triggers two modals)
  // Get master password from the field, use user password from registration
  const masterPassword = await setKeysPage.getMasterPassword();
  await setKeysPage.encryptAndSaveKeys({
    masterPassword,
    userPassword: credentials.password,
  });

  // Now on user settings, navigate to transfer list
  await transferListPage.goto();
  await expect(page).toHaveURL(transferListPage.URL);

  // Go to new transfer page
  await newTransferPage.goto();
  await waitPageReady(page);

  await newTransferPage.createTransfer({
    recipient: credentials.username + '@' + DOMAIN,
    subject: 'My test transfer',
    files: [TEST_FILE_PATH],
  });

  // After sending, redirected to transfer list
  await expect(page).toHaveURL(transferListPage.URL);
  await waitPageReady(page);

  await transferListPage.acceptTransfer('My test transfer');
  await transferListPage.downloadTransfer(
    'My test transfer',
    credentials.password,
  );

  // Logout
  await transferListPage.logout();
  await expect(page).toHaveURL(loginPage.URL);

  // Assert JWT/session cookie is cleared
  const cookies = await context.cookies();
  expect(cookies.some((cookie) => cookie.name === 'jwt')).toBeFalsy();
});
