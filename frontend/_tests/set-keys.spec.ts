/**
 * @jest-environment jsdom
 */

import { generateKeyPair, generateMasterPassword } from '../set-keys';

// Mock KeyManager and SecurityUtils dependencies
jest.mock('../crypto/key-manager', () => ({
  KeyManager: {
    generateRSAKeyPair: jest.fn(() => ({
      publicKey: 'mockPublicKey',
      privateKey: 'mockPrivateKey',
    })),
    exportPublicKey: jest.fn(() => 'mockExportedPublicKey'),
    exportEncryptedPrivateKey: jest.fn(() => 'mockExportedEncryptedPrivateKey'),
  },
}));
jest.mock('../crypto/security-utils', () => ({
  SecurityUtils: {
    generateMasterPassword: jest.fn(() => 'mockMasterPassword'),
    hash: jest.fn(() => 'mockHashedValue'),
  },
}));

describe('set-keys.ts functions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="masterPasswordField" />
      <textarea id="publicKeyHashField"></textarea>
      <button id="encryptAndSaveBtn" disabled></button>
      <input id="modalMasterPasswordInput" />
      <div id="modalMasterPasswordError"></div>
      <input id="modalUserPasswordInput" />
      <div id="modalUserPasswordError"></div>
    `;
  });

  describe('generateKeyPair', () => {
    test('generateKeyPair sets publicKeyField', async () => {
      await generateKeyPair();
      expect(
        (document.getElementById('publicKeyHashField') as HTMLTextAreaElement)
          .value,
      ).toBe('mockHashedValue');
    });
  });

  describe('generateMasterPassword', () => {
    test('generateMasterPassword sets masterPasswordField', () => {
      // when
      generateMasterPassword();

      // then
      expect(
        (document.getElementById('masterPasswordField') as HTMLInputElement)
          .value,
      ).toBe('mockMasterPassword');
    });
  });

  describe('encryptAndSaveButton State', () => {
    test('buttonState updates from disabled to enabled when keys and password are generated', async () => {
      // given + then
      expect(
        (document.getElementById('encryptAndSaveBtn') as HTMLButtonElement)
          .disabled,
      ).toBe(true);

      // when
      await generateKeyPair();
      generateMasterPassword();

      // then
      expect(
        (document.getElementById('encryptAndSaveBtn') as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });
  });
});
