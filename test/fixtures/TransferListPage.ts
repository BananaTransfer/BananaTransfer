import CommonPage from '@test/fixtures/CommonPage';
import { Page } from '@playwright/test';

export default class TransferListPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/transfer');
  }

  public async logout() {
    await this.PAGE.click('a.btn-outline-danger[title="Logout"]');
  }
}
