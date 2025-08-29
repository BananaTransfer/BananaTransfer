import CommonPage from '@test/fixtures/CommonPage';
import { expect, Page, Locator } from '@playwright/test';

export default class TransferListPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/transfer');
  }

  public async logout() {
    await this.PAGE.click('a.btn-outline-danger[title="Logout"]');
  }

  public getTransferRowBySubject(subject: string): Locator {
    return this.PAGE.locator('tr', { hasText: subject });
  }

  public async acceptTransfer(subject: string) {
    const row = this.getTransferRowBySubject(subject);
    await expect(row).toBeVisible();
    const acceptBtn = row.getByRole('button', { name: /accept/i });
    await acceptBtn.click();
  }

  public async downloadTransfer(subject: string, password: string) {
    const row = this.getTransferRowBySubject(subject);
    const downloadBtn = row.getByRole('button', { name: /download/i });
    await expect(downloadBtn).toBeVisible();
    await downloadBtn.click();
    const masterPasswordInput = this.PAGE.locator('input[type="password"]');
    await expect(masterPasswordInput).toBeVisible();
    await masterPasswordInput.fill(password);
    const confirmBtn = this.PAGE.getByRole('button', { name: /^Confirm$/i });
    await confirmBtn.click();
  }
}
