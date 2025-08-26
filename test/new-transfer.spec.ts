import { expect } from '@playwright/test';
import { test } from '@test/config';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const DOMAIN = process.env.DOMAIN ?? '';
const TEST_FILE_PATH = process.env.TEST_FILE_PATH || 'test.txt';
if (!fs.existsSync(TEST_FILE_PATH)) {
  fs.writeFileSync(TEST_FILE_PATH, 'This is a test file for transfer.');
}

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
  const credentials = {
    username:
      faker.person.firstName().toLowerCase() +
      faker.number.int({ min: 10000, max: 99999 }),
    password: faker.internet.password({ length: 13 }),
  };
  await registerPage.register(credentials);

  // If username exists, registration fails (stay on /auth/register)
  if (page.url().includes('/auth/register')) {
    // Registration failed, go to login
    await loginPage.goto();
    await loginPage.login(credentials);
    // After login, land on transfer list
    await expect(page).toHaveURL(transferListPage.URL);
  } else {
    // Registration succeeded, redirected to set keys
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

    // Now on user settings, navigate to transfer list
    await transferListPage.goto();
    await expect(page).toHaveURL(transferListPage.URL);
  }

  // Go to new transfer page
  await newTransferPage.goto();

  // Fill recipient with own username (send to self)
  await newTransferPage.setRecipient(credentials.username + DOMAIN);

  // Load recipient key if there's a button (simulate click if present)
  const recipientBtn = newTransferPage.PAGE.locator('#recipient-btn');
  if (await recipientBtn.isVisible()) {
    await recipientBtn.click();
  }

  // Click "trust" if checkbox appears
  await newTransferPage.trustRecipientKey();

  // Upload a file
  await newTransferPage.addFiles([TEST_FILE_PATH]);

  // Fill subject
  await newTransferPage.setSubject('My test transfer');

  // Enable send button if disabled
  await newTransferPage.PAGE.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.removeAttribute('disabled');
  });

  // Send transfer
  await newTransferPage.submit();

  // After sending, redirected to transfer list
  await expect(page).toHaveURL(transferListPage.URL);

  // Find the newly created transfer in the list by subject
  const transferRow = page.locator('tr', { hasText: 'My test transfer' });
  await expect(transferRow).toBeVisible();

  // Accept the transfer
  const acceptButton = transferRow.getByRole('button', { name: /accept/i });
  await acceptButton.click();

  // Wait for buttons to update to "download" and "delete"
  const downloadButton = transferRow.getByRole('button', { name: /download/i });
  await expect(downloadButton).toBeVisible();

  // Download: click download, modal opens for master password
  await downloadButton.click();
  const masterPasswordInput = page.locator('input[type="password"]');
  await expect(masterPasswordInput).toBeVisible();
  await masterPasswordInput.fill(credentials.password);

  // Submit modal form (assume button text "Download" in modal)
  const modalDownloadBtn = page.getByRole('button', { name: /^Confirm$/i });
  await modalDownloadBtn.click();

  // Logout
  await transferListPage.logout();
  await expect(page).toHaveURL(loginPage.URL);
  await expect(page.locator('#username')).toBeVisible();

  // Assert JWT/session cookie is cleared
  const cookies = await context.cookies();
  expect(cookies.some((cookie) => cookie.name === 'jwt')).toBeFalsy();
});
