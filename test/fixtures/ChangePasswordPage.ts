import { Page } from '@playwright/test';
import CommonPage from '@test/fixtures/CommonPage';

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export default class ChangePasswordPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/user/change-password');
  }

  public currentPasswordInput = this.PAGE.locator('#currentPassword');
  public newPasswordInput = this.PAGE.locator('#password');
  public confirmPasswordInput = this.PAGE.locator('#confirmPassword');
  public submitButton = this.PAGE.locator('button[type="submit"]');
  public errorAlert = this.PAGE.locator('.alert-danger');

  async setCurrentPassword(password: string) {
    await this.currentPasswordInput.fill(password);
  }

  async setNewPassword(password: string) {
    await this.newPasswordInput.fill(password);
  }

  async setConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async changePassword(params: ChangePasswordParams) {
    await this.setCurrentPassword(params.currentPassword);
    await this.setNewPassword(params.newPassword);
    await this.setConfirmPassword(params.confirmPassword || params.newPassword);
    await this.submit();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.errorAlert.isVisible()) {
      return await this.errorAlert.textContent();
    }
    return null;
  }
}
