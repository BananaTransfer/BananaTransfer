import { Page } from '@playwright/test';
import CommonPage from '@test/fixtures/CommonPage';

export default class LoginPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/auth/login');
  }
}
