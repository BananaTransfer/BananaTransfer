/**
 * @jest-environment jsdom
 */

import { generateKeyPair, generateMasterPassword } from './set-keys';

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
    `;
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
