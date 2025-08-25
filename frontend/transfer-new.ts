import { FileEncryption, StreamChunk } from './crypto/encryption.js';
import {
  callApi,
  copyToClipboard,
  enforceLowerCase,
  formatFileSize,
} from './utils/common.js';
import {
  SecurityUtils,
  RecipientPublicKeyData,
} from './crypto/security-utils.js';

interface TransferFormElements {
  recipientInput: HTMLInputElement;
  recipientBtn: HTMLButtonElement;
  publicKeyHashField: HTMLInputElement;
  copyPublicKeyHashBtn: HTMLButtonElement;
  trustRecipientKey: HTMLElement;
  trustRecipientKeyCheckbox: HTMLInputElement;
  newRecipientInfo: HTMLElement;
  newRecipientKeyWarning: HTMLElement;
  recipientKeyNotFoundError: HTMLElement;
  fileUploadArea: HTMLElement;
  fileInput: HTMLInputElement;
  subjectInput: HTMLInputElement;
  sendButton: HTMLButtonElement;
  sendError: HTMLElement;
}

class TransferNewPage {
  private formElements!: TransferFormElements;
  private selectedFile: File | null = null;
  private trustPublicKeyRequired: boolean = false;
  private recipientPublicKey: RecipientPublicKeyData | null = null;

  constructor() {
    this.initializeElements();
    this.attachEventListeners();
  }

  private initializeElements(): void {
    this.formElements = {
      recipientInput: document.getElementById('recipient') as HTMLInputElement,
      recipientBtn: document.getElementById(
        'recipient-btn',
      ) as HTMLButtonElement,

      publicKeyHashField: document.getElementById(
        'publicKeyHashField',
      ) as HTMLInputElement,
      copyPublicKeyHashBtn: document.getElementById(
        'copyPublicKeyHashBtn',
      ) as HTMLButtonElement,

      trustRecipientKey: document.getElementById(
        'trustRecipientKey',
      ) as HTMLElement,
      trustRecipientKeyCheckbox: document.getElementById(
        'trustKeyCheckbox',
      ) as HTMLInputElement,

      newRecipientInfo: document.getElementById(
        'newRecipientInfo',
      ) as HTMLElement,
      newRecipientKeyWarning: document.getElementById(
        'newRecipientKeyWarning',
      ) as HTMLElement,
      recipientKeyNotFoundError: document.getElementById(
        'recipientKeyNotFoundError',
      ) as HTMLElement,

      fileUploadArea: document.querySelector(
        '.file-upload-area',
      ) as HTMLElement,
      fileInput: document.getElementById('fileInput') as HTMLInputElement,
      subjectInput: document.getElementById('subject') as HTMLInputElement,

      sendButton: document.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement,
      sendError: document.getElementById('sendError') as HTMLElement,
    };
    this.updateSendButtonState();
  }

  private attachEventListeners(): void {
    this.formElements.recipientInput.addEventListener('input', () => {
      enforceLowerCase(this.formElements.recipientInput);

      this.resetRecipientPublicKey();
    });

    // load recipient key btn
    this.formElements.recipientBtn.addEventListener('click', () => {
      void this.handleRecipientPublicKeyFetch();
    });

    // Copy public key hash button
    this.formElements.copyPublicKeyHashBtn.addEventListener('click', () => {
      void copyToClipboard(
        this.formElements.publicKeyHashField,
        this.formElements.copyPublicKeyHashBtn,
      );
    });

    // Drag and drop handlers
    this.formElements.fileUploadArea.addEventListener('dragover', (event) => {
      event.preventDefault();
      this.formElements.fileUploadArea.classList.add('drag-over');
    });

    this.formElements.fileUploadArea.addEventListener('dragleave', () => {
      this.formElements.fileUploadArea.classList.remove('drag-over');
    });

    this.formElements.fileUploadArea.addEventListener('drop', (event) => {
      event.preventDefault();
      this.formElements.fileUploadArea.classList.remove('drag-over');

      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        this.formElements.fileInput.files = files;
        this.handleFileSelection({ target: { files } } as unknown as Event);
      }
    });

    // File upload area click handler
    this.formElements.fileUploadArea.addEventListener('click', () => {
      this.formElements.fileInput.click();
    });

    // File selection handler
    this.formElements.fileInput.addEventListener('change', (event) => {
      this.handleFileSelection(event);
    });

    // Send button handler
    this.formElements.sendButton.addEventListener('click', (event) => {
      event.preventDefault();
      void this.handleSubmit();
    });
  }

  private updateSendButtonState(): void {
    const recipient = !!this.recipientPublicKey;
    const fileSelected = !!this.selectedFile;
    this.formElements.sendButton.disabled = !(recipient && fileSelected);
  }

  private resetRecipientPublicKey(): void {
    this.recipientPublicKey = null;
    this.updateRecipientPublicKeyInfo();
    this.updateSendButtonState();
  }

  private async handleRecipientPublicKeyFetch() {
    try {
      // if invalid recipient value, prevent API call
      if (!this.formElements.recipientInput.reportValidity()) {
        return;
      }

      this.formElements.publicKeyHashField.value = '';

      this.recipientPublicKey = await SecurityUtils.useRecipientPublicKey(
        this.formElements.recipientInput.value.trim(),
      );

      this.updateRecipientPublicKeyInfo();
      this.updateSendButtonState();
    } catch {
      this.formElements.recipientKeyNotFoundError.classList.remove('d-none');
    }
  }

  private updateRecipientPublicKeyInfo() {
    this.formElements.newRecipientInfo.classList.add('d-none');
    this.formElements.newRecipientKeyWarning.classList.add('d-none');
    this.formElements.recipientKeyNotFoundError.classList.add('d-none');
    this.formElements.trustRecipientKey.classList.add('d-none');
    this.formElements.trustRecipientKeyCheckbox.checked = false;
    this.trustPublicKeyRequired = false;

    if (!this.recipientPublicKey) {
      this.formElements.publicKeyHashField.value = '';
    } else {
      this.formElements.publicKeyHashField.value =
        this.recipientPublicKey.publicKeyHash;
      if (!this.recipientPublicKey.isKnownRecipient) {
        this.formElements.newRecipientInfo.classList.remove('d-none');
        this.formElements.trustRecipientKey.classList.remove('d-none');
        this.trustPublicKeyRequired = true;
      } else if (!this.recipientPublicKey.isTrustedRecipientKey) {
        this.formElements.newRecipientKeyWarning.classList.remove('d-none');
        this.formElements.trustRecipientKey.classList.remove('d-none');
        this.trustPublicKeyRequired = true;
      }
    }
  }

  private handleFileSelection(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      this.selectedFile = files[0];

      // Update file upload area to show selected file
      const fileIcon = this.formElements.fileUploadArea.querySelector('i');
      const fileText = this.formElements.fileUploadArea.querySelector('h5');

      if (fileIcon && fileText) {
        fileIcon.className = 'bi bi-file-earmark display-4 mb-3';
        fileText.textContent = `Selected: ${this.selectedFile.name} (${formatFileSize(this.selectedFile.size)})`;
      }

      // Auto-fill subject if empty
      if (!this.formElements.subjectInput.value) {
        this.formElements.subjectInput.value = this.selectedFile.name;
      }
    }
    this.updateSendButtonState();
  }

  private showSendError(error: string) {
    this.formElements.sendError.classList.remove('d-none');
    this.formElements.sendError.textContent = error;
  }

  private async handleSubmit(): Promise<void> {
    // Validation

    // if invalid subject input, prevent submit
    if (!this.formElements.subjectInput.reportValidity()) {
      return;
    }

    // check that recipient is entered
    const recipientAddress = this.formElements.recipientInput.value.trim();
    if (!recipientAddress) {
      return this.showSendError('Please enter a recipient address.');
    }

    // check that recipient key is loaded
    if (!this.recipientPublicKey?.importedPublicKey) {
      return this.showSendError(
        'Please select a recipient and load their public key.',
      );
    }

    // check that the checkbox to trust recipient key is set if needed
    if (
      this.trustPublicKeyRequired &&
      !this.formElements.trustRecipientKeyCheckbox.checked
    ) {
      return this.showSendError(
        'You must trust the public key of the recipient.',
      );
    }

    // check that there is a file selected
    if (!this.selectedFile) {
      return this.showSendError('Please select a file to transfer.');
    }

    // check that the subject is entered
    const subject = this.formElements.subjectInput.value.trim();
    if (!subject) {
      return this.showSendError('Please enter a subject for the transfer.');
    }

    try {
      // Disable send button during processing
      this.formElements.sendButton.disabled = true;
      this.formElements.sendButton.textContent = 'Encrypting and uploading...';

      // Step 1: Create the transfer
      const aesKey = await FileEncryption.generateAESKey();
      const wrappedAesKey = await FileEncryption.wrapAESKey(
        aesKey,
        this.recipientPublicKey.importedPublicKey,
      );

      const transfer = await this.createTransfer(
        wrappedAesKey,
        recipientAddress,
        subject,
      );

      // Step 2: Encrypt file and upload chunks to server
      await FileEncryption.encryptFile(aesKey, this.selectedFile, (chunk) => {
        return this.sendChunksToServer(chunk, transfer.id);
      });

      console.log(`File encryption completed`);

      // Redirect to transfers list on success
      window.location.href = '/transfer';
    } catch (error) {
      console.error('Error creating transfer:', error);
      this.showSendError('Failed to create transfer. Please try again.');
    } finally {
      // Re-enable send button
      this.formElements.sendButton.disabled = false;
      this.formElements.sendButton.textContent = 'Send file(s)';
    }
  }

  private async createTransfer(
    wrappedAesKey: ArrayBuffer,
    recipientAddress: string,
    subject: string,
  ): Promise<{ id: string }> {
    const payload = {
      recipient: recipientAddress,
      filename: this.selectedFile!.name,
      subject: subject,
      symmetric_key_encrypted: this.arrayBufferToBase64(wrappedAesKey),
      recipient_public_key_hash: this.recipientPublicKey!.publicKeyHash,
      trust_recipient_key: this.formElements.trustRecipientKeyCheckbox.checked,
    };

    return callApi('POST', '/transfer/new', payload);
  }

  private async sendChunksToServer(
    encryptedChunks: StreamChunk,
    transferId: string,
  ): Promise<void> {
    this.formElements.sendButton.textContent = `Uploading chunk ${encryptedChunks.chunkIndex}...`;

    const payload = {
      encryptedData: this.arrayBufferToBase64(encryptedChunks.encryptedData),
      chunkIndex: encryptedChunks.chunkIndex,
      isLastChunk: encryptedChunks.isLastChunk,
      iv: this.arrayBufferToBase64(encryptedChunks.iv),
    };

    return callApi('POST', `/transfer/${transferId}/chunk`, payload);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    const charArray: string[] = [];

    for (let i = 0; i < bytes.length; i++) {
      charArray.push(String.fromCharCode(bytes[i]));
    }

    return btoa(charArray.join(''));
  }
}

// Setup function called from the Pug template
export function setupNewTransfer(): void {
  document.addEventListener('DOMContentLoaded', () => {
    new TransferNewPage();
  });
}
