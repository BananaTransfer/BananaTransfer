import { callApi, showModal } from './utils/common.js';
import { KeyManager } from './crypto/key-manager.js';
import { SecurityUtils } from './crypto/security-utils.js';
export let generatedKeyPair: CryptoKeyPair | null = null;
export let generatedMasterPassword: string | null = null;

function updateEncryptButtonState() {
  const masterPassword = (
    document.getElementById('masterPasswordField') as HTMLInputElement
  ).value;
  const publicKey = (
    document.getElementById('publicKeyField') as HTMLTextAreaElement
  ).value;
  const btn = document.getElementById('encryptAndSaveBtn') as HTMLButtonElement;
  btn.disabled = !(masterPassword && publicKey);
}

export async function generateKeyPair() {
  generatedKeyPair = await KeyManager.generateRSAKeyPair();
  const publicKeyBase64 = await KeyManager.exportPublicKey(
    generatedKeyPair.publicKey,
  );
  (document.getElementById('publicKeyField') as HTMLInputElement).value =
    publicKeyBase64;
  updateEncryptButtonState();
}

export function generateMasterPassword() {
  generatedMasterPassword = SecurityUtils.generateMasterPassword();
  (document.getElementById('masterPasswordField') as HTMLInputElement).value =
    generatedMasterPassword;
  updateEncryptButtonState();
}

async function showMasterPasswordModal(): Promise<string> {
  (
    document.getElementById('modalMasterPasswordText') as HTMLElement
  ).textContent =
    'Please enter your new Master-Password to confirm this action';

  const enteredMasterPassword = await showModal(
    'masterPasswordModal',
    'modalMasterPasswordInput',
    'modalMasterPasswordConfirmBtn',
    'modalMasterPasswordError',
  );
  // throw if master password entry canceled
  if (!enteredMasterPassword)
    throw new Error(
      'New Master-Password must be confirmed to save the new Key-Pair',
    );
  return enteredMasterPassword;
}

async function showUserPasswordModal(): Promise<string> {
  const enteredUserPassword = await showModal(
    'userPasswordModal',
    'modalUserPasswordInput',
    'modalUserPasswordConfirmBtn',
    'modalUserPasswordError',
  );
  // throw if user password entry canceled
  if (!enteredUserPassword)
    throw new Error(
      'Setting the new Key-Pair must be confirmed with User password',
    );
  return enteredUserPassword;
}

export async function encryptAndSaveKey() {
  try {
    if (!generatedKeyPair || !generatedMasterPassword) {
      alert('Generate a key pair and master password first.');
      return;
    }

    // show master-password modal
    const enteredMasterPassword = await showMasterPasswordModal();
    // throw error if wrong master password was entered
    if (enteredMasterPassword !== generatedMasterPassword)
      throw new Error('The entered Master-Password is incorrect');

    // show user-password modal
    const userPassword = await showUserPasswordModal();

    // Continue with encryption and saving
    const encryptedPrivateKey = await KeyManager.encryptPrivateKey(
      generatedKeyPair.privateKey,
      generatedMasterPassword,
    );
    const exportedPrivateKey =
      KeyManager.exportEncryptedPrivateKey(encryptedPrivateKey);
    const exportedPublicKey = await KeyManager.exportPublicKey(
      generatedKeyPair.publicKey,
    );

    const result: { redirect?: string } = await callApi(
      'POST',
      `/user/set-keys`,
      {
        password: userPassword,
        publicKey: exportedPublicKey,
        privateKeyEncrypted: exportedPrivateKey.privateKey,
        privateKeySalt: exportedPrivateKey.salt,
        privateKeyIv: exportedPrivateKey.iv,
      },
    );

    if (result?.redirect) {
      window.location.href = result.redirect;
    }
  } catch (error) {
    (document.getElementById('setKeyError') as HTMLElement).textContent = (
      error as Error
    ).message;
  }
}
