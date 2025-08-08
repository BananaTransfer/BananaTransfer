import { Page } from '@playwright/test';
import CommonPage from '@test/fixtures/CommonPage';

export interface LoginParams {
  username: string;
  password: string;
}

export default class LoginPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/auth/login');
  }

  public async setUsername(username: string) {
    await this.PAGE.locator('#username').fill(username);
  }

  public async setPassword(password: string) {
    await this.PAGE.locator('#password').fill(password);
  }

  public async submit() {
    await this.PAGE.getByTestId('login-submit-btn').click();
  }

  public async login(params: LoginParams) {
    await this.setUsername(params.username);
    await this.setPassword(params.password);
    await this.submit();
  }
}
