import { expect, Page } from '@playwright/test';
import { test } from './config';

async function testLinkAvailable(
  page: Page,
  linkId: string,
  expectedUrl: string,
) {
  await page.goto('/');

  const link = page.getByTestId(linkId);

  await expect(link).toBeVisible();

  await link.click();

  await expect(page).toHaveURL(expectedUrl);
}

test.describe('home page', () => {
  test('has login link', async ({ page, loginPage }) => {
    await testLinkAvailable(page, 'login-link', loginPage.URL);
  });

  test('has register link', async ({ page, registerPage }) => {
    await testLinkAvailable(page, 'register-link', registerPage.URL);
  });
})
