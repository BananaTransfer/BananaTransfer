import { Page } from '@playwright/test';
import CommonPage from '@test/fixtures/CommonPage';

export interface NewTransferParams {
  recipient: string;
  subject?: string;
  files: string[]; // file paths to upload
}

export default class NewTransferPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/transfer/new');
  }

  public recipientInput = this.PAGE.locator('#recipient');
  public subjectInput = this.PAGE.locator('#subject');
  public fileInput = this.PAGE.locator('#fileInput');
  public sendButton = this.PAGE.locator('button[type="submit"]');
  public publicKeyHashField = this.PAGE.locator('#publicKeyHashField');
  public recipientKeyError = this.PAGE.locator('#recipientKeyNotFoundError');
  public sendError = this.PAGE.locator('#sendError');

  async setRecipient(recipient: string) {
    await this.recipientInput.fill(recipient);
    // Optionally blur to trigger key loading
    await this.recipientInput.blur();
  }

  async setSubject(subject: string) {
    await this.subjectInput.fill(subject);
  }

  async addFiles(files: string[]) {
    await this.fileInput.setInputFiles(files);
  }

  async submit() {
    await this.PAGE.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.removeAttribute('disabled');
    });
    await this.sendButton.click();
  }

  async createTransfer(params: NewTransferParams) {
    await this.setRecipient(params.recipient);
    if (params.subject) {
      await this.setSubject(params.subject);
    }
    await this.addFiles(params.files);
    await this.submit();
  }

  async getRecipientKeyHash(): Promise<string | null> {
    return await this.publicKeyHashField.inputValue();
  }

  async getRecipientKeyError(): Promise<string | null> {
    if (await this.recipientKeyError.isVisible()) {
      return await this.recipientKeyError.textContent();
    }
    return null;
  }

  async getSendError(): Promise<string | null> {
    if (await this.sendError.isVisible()) {
      return await this.sendError.textContent();
    }
    return null;
  }
}
