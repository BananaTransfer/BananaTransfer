import { test, expect, Page } from '@playwright/test';

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

test('has login link', async ({ page }) => {
  await testLinkAvailable(page, 'login-link', '/auth/login');
});

test('has register link', async ({ page }) => {
  await testLinkAvailable(page, 'register-link', '/auth/register');
});
