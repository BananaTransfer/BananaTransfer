import { Page, Locator } from '@playwright/test';
import CommonPage from '@test/fixtures/CommonPage';

export interface NewTransferParams {
  recipient: string;
  subject?: string;
  files: string[]; // file paths to upload
}

export default class NewTransferPage extends CommonPage {
  private recipientInput: Locator;
  private subjectInput: Locator;
  private fileInput: Locator;
  private sendButton: Locator;
  private publicKeyHashField: Locator;
  private recipientBtn: Locator;
  private recipientKeyError: Locator;
  private sendError: Locator;
  private trustCheckbox: Locator;

  constructor(page: Page) {
    super(page, '/transfer/new');
    this.recipientInput = this.PAGE.locator('#recipient');
    this.subjectInput = this.PAGE.locator('#subject');
    this.fileInput = this.PAGE.locator('#fileInput');
    this.sendButton = this.PAGE.locator('button[type="submit"]');
    this.publicKeyHashField = this.PAGE.locator('#publicKeyHashField');
    this.recipientBtn = this.PAGE.locator('#recipient-btn');
    this.recipientKeyError = this.PAGE.locator('#recipientKeyNotFoundError');
    this.sendError = this.PAGE.locator('#sendError');
    this.trustCheckbox = this.PAGE.locator('#trustKeyCheckbox');
  }

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

    await this.recipientBtn.click();

    // Click "trust" if checkbox appears
    await this.trustRecipientKey();

    await this.addFiles(params.files);

    if (params.subject) {
      await this.setSubject(params.subject);
    }

    // Enable send button if disabled
    await this.PAGE.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.removeAttribute('disabled');
    });

    await this.submit();
  }

  async trustRecipientKey() {
    await this.trustCheckbox.check();
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
