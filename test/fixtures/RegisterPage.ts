import { Page } from '@playwright/test';
import CommonPage from '@test/fixtures/CommonPage';

export interface RegisterDataModel {
  username: string;
  // will be set to username@domain if not set
  email?: string;
  password: string;
  // will be set to password if not set
  confirmPassword?: string;
}

export default class RegisterPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/auth/register');
  }

  public async setUsername(username: string) {
    await this.PAGE.locator('#username').fill(username);
  }

  public async setEmail(email: string) {
    await this.PAGE.locator('#email').fill(email);
  }

  public async setFirstPassword(password: string) {
    await this.PAGE.locator('#password').fill(password);
  }

  public async setSecondPassword(password: string) {
    await this.PAGE.locator('#confirmPassword').fill(password);
  }

  public async submit() {
    await this.PAGE.getByTestId('register-submit-btn').click();
  }

  public async register(data: RegisterDataModel) {
    await this.setUsername(data.username);
    if (data.email) {
      await this.setEmail(data.email);
    }
    await this.setFirstPassword(data.password);
    await this.setSecondPassword(data.confirmPassword || data.password);
    await this.submit();
  }
}
