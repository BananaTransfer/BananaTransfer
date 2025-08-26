import CommonPage from '@test/fixtures/CommonPage';
import { Page, Locator, expect } from '@playwright/test';

export default class SetKeysPage extends CommonPage {
  // Buttons
  private generateKeyPairBtn: Locator;
  private generateMasterPasswordBtn: Locator;
  private encryptAndSaveBtn: Locator;

  // Fields
  private publicKeyHashField: Locator;
  private masterPasswordField: Locator;

  // Modals (master password modal)
  private masterPasswordModal: Locator;
  private modalMasterPasswordInput: Locator;
  private modalMasterPasswordConfirmBtn: Locator;

  // Modals (user password modal)
  private userPasswordModal: Locator;
  private modalUserPasswordInput: Locator;
  private modalUserPasswordConfirmBtn: Locator;

  // Error field
  private setKeyError: Locator;

  constructor(page: Page) {
    super(page, '/user/set-keys');
    // Buttons
    this.generateKeyPairBtn = this.PAGE.locator('#generateKeyPairBtn');
    this.generateMasterPasswordBtn = this.PAGE.locator(
      '#generateMasterPasswordBtn',
    );
    this.encryptAndSaveBtn = this.PAGE.locator('#encryptAndSaveBtn');
    // Fields
    this.publicKeyHashField = this.PAGE.locator('#publicKeyHashField');
    this.masterPasswordField = this.PAGE.locator('#masterPasswordField');
    // Modals (master password modal)
    this.masterPasswordModal = this.PAGE.locator('#masterPasswordModal');
    this.modalMasterPasswordInput = this.PAGE.locator(
      '#modalMasterPasswordInput',
    );
    this.modalMasterPasswordConfirmBtn = this.PAGE.locator(
      '#modalMasterPasswordConfirmBtn',
    );
    // Modals (user password modal)
    this.userPasswordModal = this.PAGE.locator('#userPasswordModal');
    this.modalUserPasswordInput = this.PAGE.locator('#modalUserPasswordInput');
    this.modalUserPasswordConfirmBtn = this.PAGE.locator(
      '#modalUserPasswordConfirmBtn',
    );
    // Error field
    this.setKeyError = this.PAGE.locator('#setKeyError');
  }

  // Actions
  async generateKeyPair() {
    await expect(this.generateKeyPairBtn).toBeEnabled();
    await expect(this.publicKeyHashField).toBeEmpty();
    await this.generateKeyPairBtn.click();
    await expect(this.publicKeyHashField).not.toBeEmpty();
  }

  async generateMasterPassword() {
    await this.generateMasterPasswordBtn.click();
    await expect(this.masterPasswordField).not.toHaveValue('');
  }

  async getMasterPassword() {
    return await this.masterPasswordField.inputValue();
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
