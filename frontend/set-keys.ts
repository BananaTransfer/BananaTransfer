import { KeyManager } from './key-manager.js';
import { SecurityUtils } from './security-utils.js';
export let generatedKeyPair: CryptoKeyPair | null = null;

declare global {
  interface Window {
    bootstrap: any;
  }
}

interface BootstrapModal {
  show: () => void;
  hide: () => void;
}

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

function showModal(
  modalId: string,
  inputId: string,
  confirmBtnId: string,
  errorId?: string,
  errorMessage: string = '',
): Promise<string | null> {
  return new Promise((resolve) => {
    const modalEl = document.getElementById(modalId)!;
    const inputEl = document.getElementById(inputId) as HTMLInputElement;
    const confirmBtn = document.getElementById(confirmBtnId)!;
    const errorDiv = errorId ? document.getElementById(errorId)! : null;
    const modal = new (
      window.bootstrap as { Modal: new (el: HTMLElement) => BootstrapModal }
    ).Modal(modalEl);

    inputEl.value = '';
    if (errorDiv) errorDiv.textContent = errorMessage;

    function cleanup() {
      confirmBtn.removeEventListener('click', onConfirm);
      modalEl.removeEventListener('hidden.bs.modal', onCancel);
    }

    function onConfirm() {
      if (!inputEl.value) {
        if (errorDiv) {
          errorDiv.textContent = 'This field is required';
        }
        inputEl.focus();
        return;
      }
      cleanup();
      modal.hide();
      resolve(inputEl.value);
    }

    function onCancel() {
      cleanup();
      resolve(null);
    }

    confirmBtn.addEventListener('click', onConfirm);
    modalEl.addEventListener('hidden.bs.modal', onCancel);
    modal.show();
    inputEl.focus();
  });
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
  const generatedMasterPassword = SecurityUtils.generateMasterPassword();
  (document.getElementById('masterPasswordField') as HTMLInputElement).value =
    generatedMasterPassword;
  updateEncryptButtonState();
}

export async function encryptAndSaveKey() {
  const masterPassword = (
    document.getElementById('masterPasswordField') as HTMLInputElement
  ).value;
  if (!generatedKeyPair || !masterPassword) {
    alert('Generate a key pair and master password first.');
    return;
  }

  // show master-password modal (loop until correct master password is entered)
  let enteredMasterPassword: string | null = null;
  let errorMessage = '';
  while (true) {
    (
      document.getElementById('modalMasterPasswordText') as HTMLElement
    ).textContent =
      'Please enter your new Master-Password to confirm this action';

    enteredMasterPassword = await showModal(
      'masterPasswordModal',
      'modalMasterPasswordInput',
      'modalMasterPasswordConfirmBtn',
      'modalMasterPasswordError',
      errorMessage,
    );
    // return if user canceled action
    if (!enteredMasterPassword) return;
    // break loop if correct master password is entered
    if (enteredMasterPassword === masterPassword) break;
    // set error message if wrong master password is entered
    errorMessage = 'Incorrect Master-Password';
  }

  // show user-password modal
  const userPassword = await showModal(
    'userPasswordModal',
    'modalUserPasswordInput',
    'modalUserPasswordConfirmBtn',
    'modalUserPasswordError',
  );
  // return if user canceled action
  if (!userPassword) {
    return;
  }

  // Continue with encryption and saving
  const exportedPrivateKey = await KeyManager.exportEncryptedPrivateKey(
    generatedKeyPair.privateKey,
    masterPassword,
  );
  // TODO: send exportedPrivateKey and userPassword to server
  console.log(
    'exportedPrivateKey:',
    exportedPrivateKey,
    'userPassword:',
    userPassword,
  );
}

export async function copyToClipboard(inputId: string, btnId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const btn = document.getElementById(btnId) as HTMLButtonElement;
  if (!input.value) {
    // Optionally, you can give user feedback here (e.g., shake button, show tooltip)
    return;
  }
  await navigator.clipboard.writeText(input.value);
  btn.innerHTML = '<i class="bi bi-clipboard-check"></i>';
  setTimeout(() => {
    btn.innerHTML = '<i class="bi bi-clipboard"></i>';
  }, 1500);
}
