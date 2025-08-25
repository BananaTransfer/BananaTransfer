import { Page, Locator } from '@playwright/test';
import CommonPage from '@test/fixtures/CommonPage';

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export default class ChangePasswordPage extends CommonPage {
  private currentPasswordInput: Locator;
  private newPasswordInput: Locator;
  private confirmPasswordInput: Locator;
  private submitButton: Locator;
  private errorAlert: Locator;

  constructor(page: Page) {
    super(page, '/user/change-password');
    this.currentPasswordInput = this.PAGE.locator('#currentPassword');
    this.newPasswordInput = this.PAGE.locator('#password');
    this.confirmPasswordInput = this.PAGE.locator('#confirmPassword');
    this.submitButton = this.PAGE.locator('button[type="submit"]');
    this.errorAlert = this.PAGE.locator('.alert-danger');
  }

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
