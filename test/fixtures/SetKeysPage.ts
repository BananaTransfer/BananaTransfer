import CommonPage from '@test/fixtures/CommonPage';
import { Page, expect } from '@playwright/test';

export default class SetKeysPage extends CommonPage {
  constructor(page: Page) {
    super(page, '/user/set-keys');
  }

  // Buttons
  get generateKeyPairBtn() {
    return this.PAGE.locator('#generateKeyPairBtn');
  }
  get generateMasterPasswordBtn() {
    return this.PAGE.locator('#generateMasterPasswordBtn');
  }
  get encryptAndSaveBtn() {
    return this.PAGE.locator('#encryptAndSaveBtn');
  }

  // Fields
  get publicKeyHashField() {
    return this.PAGE.locator('#publicKeyHashField');
  }
  get masterPasswordField() {
    return this.PAGE.locator('#masterPasswordField');
  }

  // Modals (master password modal)
  get masterPasswordModal() {
    return this.PAGE.locator('#masterPasswordModal');
  }
  get modalMasterPasswordInput() {
    return this.PAGE.locator('#modalMasterPasswordInput');
  }
  get modalMasterPasswordConfirmBtn() {
    return this.PAGE.locator('#modalMasterPasswordConfirmBtn');
  }

  // Modals (user password modal)
  get userPasswordModal() {
    return this.PAGE.locator('#userPasswordModal');
  }
  get modalUserPasswordInput() {
    return this.PAGE.locator('#modalUserPasswordInput');
  }
  get modalUserPasswordConfirmBtn() {
    return this.PAGE.locator('#modalUserPasswordConfirmBtn');
  }

  // Error field
  get setKeyError() {
    return this.PAGE.locator('#setKeyError');
  }

  // Actions
  async generateKeyPair() {
    await expect(this.generateKeyPairBtn).toBeEnabled();
    await this.generateKeyPairBtn.click();
    await expect(this.publicKeyHashField).not.toHaveValue('');
  }

  async generateMasterPassword() {
    await this.generateMasterPasswordBtn.click();
    await expect(this.masterPasswordField).not.toHaveValue('');
  }

  async encryptAndSaveKeys({
    masterPassword,
    userPassword,
  }: {
    masterPassword: string;
    userPassword: string;
  }) {
    await expect(this.encryptAndSaveBtn).toBeEnabled();
    await this.encryptAndSaveBtn.click();

    // The frontend shows a modal for master password
    await expect(this.masterPasswordModal).toBeVisible();
    await this.modalMasterPasswordInput.fill(masterPassword);
    await this.modalMasterPasswordConfirmBtn.click();

    // Now the user password modal should appear
    await expect(this.userPasswordModal).toBeVisible();
    await this.modalUserPasswordInput.fill(userPassword);
    await this.modalUserPasswordConfirmBtn.click();

    await this.PAGE.waitForURL(/\/user\?setKeysSuccess=true/);
  }
}
