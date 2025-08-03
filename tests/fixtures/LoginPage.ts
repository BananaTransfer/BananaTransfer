import { Page } from '@playwright/test';
import CommonPage from './CommonPage';

export default class LoginPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/auth/login');
  }
}
