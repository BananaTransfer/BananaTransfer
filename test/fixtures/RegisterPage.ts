import { Page } from '@playwright/test';
import CommonPage from '@test/fixtures/CommonPage';

export interface RegisterParams {
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
    await this.PAGE.locator('#submitBtn').click();
  }

  public async register(params: RegisterParams) {
    await this.setUsername(params.username);
    if (params.email) {
      await this.setEmail(params.email);
    }
    await this.setFirstPassword(params.password);
    await this.setSecondPassword(params.confirmPassword || params.password);
    await this.submit();
  }
}
