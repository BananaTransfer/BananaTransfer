/**
 * @jest-environment jsdom
 */

import {
  generateKeyPair,
  generateMasterPassword,
  copyToClipboard,
} from './set-keys';

// Mock KeyManager and SecurityUtils dependencies
jest.mock('./key-manager.js', () => ({
  KeyManager: {
    generateRSAKeyPair: jest.fn(() => ({
      publicKey: 'mockPublicKey',
      privateKey: 'mockPrivateKey',
    })),
    exportPublicKey: jest.fn(() => 'mockExportedPublicKey'),
    exportEncryptedPrivateKey: jest.fn(() => 'mockExportedEncryptedPrivateKey'),
  },
}));
jest.mock('./security-utils.js', () => ({
  SecurityUtils: {
    generateMasterPassword: jest.fn(() => 'mockMasterPassword'),
  },
}));

describe('set-keys.ts functions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="masterPasswordField" />
      <textarea id="publicKeyField"></textarea>
      <button id="encryptAndSaveBtn" disabled></button>
      <input id="modalMasterPasswordInput" />
      <div id="modalMasterPasswordError"></div>
      <input id="modalUserPasswordInput" />
      <div id="modalUserPasswordError"></div>
      <input id="copyInput" value="test" />
      <button id="copyBtn"></button>
    `;

    // Mock clipboard if not present
    if (!navigator.clipboard) {
      // @ts-ignore
      navigator.clipboard = {};
    }
    navigator.clipboard.writeText = jest.fn();
  });

  describe('generateKeyPair', () => {
    test('generateKeyPair sets publicKeyField', async () => {
      await generateKeyPair();
      expect(
        (document.getElementById('publicKeyField') as HTMLTextAreaElement)
          .value,
      ).toBe('mockExportedPublicKey');
    });
  });

  describe('generateMasterPassword', () => {
    test('generateMasterPassword sets masterPasswordField', () => {
      generateMasterPassword();
      expect(
        (document.getElementById('masterPasswordField') as HTMLInputElement)
          .value,
      ).toBe('mockMasterPassword');
    });
  });

  describe('encryptAndSaveButton State', () => {
    test('buttonState updates from disabled to enabled when keys and password are generated', async () => {
      // Initial state
      expect(
        (document.getElementById('encryptAndSaveBtn') as HTMLButtonElement)
          .disabled,
      ).toBe(true);

      // Fill in fields
      await generateKeyPair();
      generateMasterPassword();

      expect(
        (document.getElementById('encryptAndSaveBtn') as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });
  });

  describe('copyToClipboard', () => {
    test('copyToClipboard updates button', async () => {
      const input = document.getElementById('copyInput') as HTMLInputElement;
      const btn = document.getElementById('copyBtn') as HTMLButtonElement;
      input.value = 'test content';
      await copyToClipboard('copyInput', 'copyBtn');
      expect(btn.innerHTML).toContain('bi-clipboard-check');
    });

    test('copyToClipboard copies value', async () => {
      const input = document.getElementById('copyInput') as HTMLInputElement;
      input.value = 'test content';

      // Mock clipboard
      const writeTextMock = jest.fn();
      navigator.clipboard.writeText = writeTextMock;

      await copyToClipboard('copyInput', 'copyBtn');
      expect(writeTextMock).toHaveBeenCalledWith('test content');
    });
  });

  // encryptAndSaveKey is hard to test without a DOM and modal mocks, so you would use integration/E2E tests for full coverage
});
