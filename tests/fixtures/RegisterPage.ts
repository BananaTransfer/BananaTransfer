import { Page } from '@playwright/test';
import CommonPage from './CommonPage';

export default class RegisterPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/auth/register');
  }
}
