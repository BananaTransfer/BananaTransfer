import CommonPage from '@test/fixtures/CommonPage';
import { Page } from '@playwright/test';

export default class SetKeysPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/user/set-keys');
  }
}
