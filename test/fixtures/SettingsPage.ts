import CommonPage from '@test/fixtures/CommonPage';
import { Page, Locator, expect } from '@playwright/test';

export default class SettingsPage extends CommonPage {
  private changePasswordBtn: Locator;
  private setKeysBtn: Locator;
  private logoutBtn: Locator;
  private userInfoBlock: Locator;
  private successAlert: Locator;
  private errorAlert: Locator;
  private userInfoSection: Locator;
  private accountDatesSection: Locator;

  constructor(page: Page) {
    super(page, '/user');
    this.changePasswordBtn = this.PAGE.locator(
      'a[href="/user/change-password"], #changePasswordBtn',
    );
    this.setKeysBtn = this.PAGE.locator(
      'a[href="/user/set-keys"], #setKeysBtn',
    );
    this.logoutBtn = this.PAGE.locator('a[href="/logout"], #logoutBtn');
    this.userInfoBlock = this.PAGE.locator('#userInfo, .user-info');
    this.successAlert = this.PAGE.locator('.alert-success');
    this.errorAlert = this.PAGE.locator('.alert-danger');
    this.userInfoSection = this.PAGE.locator('#userInfo, .user-info');
    this.accountDatesSection = this.PAGE.locator(
      '#accountDates, .account-dates',
    );
  }

  async gotoChangePassword(): Promise<void> {
    await expect(this.changePasswordBtn).toBeVisible();
    await this.changePasswordBtn.click();
    await expect(this.PAGE).toHaveURL('/user/change-password');
  }

  async gotoSetKeys(): Promise<void> {
    await expect(this.setKeysBtn).toBeVisible();
    await this.setKeysBtn.click();
    await expect(this.PAGE).toHaveURL('/user/set-keys');
  }

  async logout(): Promise<void> {
    await this.logoutBtn.click();
    await expect(this.PAGE).toHaveURL(/\/auth\/login/);
  }

  async getUserInfo(): Promise<{
    userInfoText: string | null;
    accountDatesText: string | null;
  }> {
    await expect(this.userInfoSection).toBeVisible();
    await expect(this.accountDatesSection).toBeVisible();
    const userInfoText: string | null =
      await this.userInfoSection.textContent();
    const accountDatesText: string | null =
      await this.accountDatesSection.textContent();
    return {
      userInfoText,
      accountDatesText,
    };
  }

  async getSuccessMessage(): Promise<string> {
    if (await this.successAlert.isVisible()) {
      const textContent: string | null = await this.successAlert.textContent();
      return textContent ?? '';
    }
    return '';
  }

  async getErrorMessage(): Promise<string> {
    if (await this.errorAlert.isVisible()) {
      const textContent: string | null = await this.errorAlert.textContent();
      return textContent ?? '';
    }
    return '';
  }
}
