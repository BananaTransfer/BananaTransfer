import { FileEncryption, StreamChunk } from './crypto/encryption.js';
import { callApi, copyToClipboard } from './utils/common.js';
import { SecurityUtils } from './crypto/security-utils.js';

interface TransferFormElements {
  recipientInput: HTMLInputElement;
  recipientBtn: HTMLButtonElement;
  publicKeyHashField: HTMLInputElement;
  copyPublicKeyHashBtn: HTMLButtonElement;
  newRecipientInfo: HTMLElement;
  newRecipientKeyWarning: HTMLElement;
  recipientKeyNotFoundError: HTMLElement;
  fileUploadArea: HTMLElement;
  fileInput: HTMLInputElement;
  subjectInput: HTMLInputElement;
  sendButton: HTMLButtonElement;
}

class TransferNewPage {
  private formElements!: TransferFormElements;
  private selectedFile: File | null = null;
  private recipientPublicKey: CryptoKey | null = null;

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
    };
    this.updateSendButtonState();
  }

  private attachEventListeners(): void {
    this.formElements.recipientInput.addEventListener('input', () => {
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
        this.handleFileSelection({ target: { files } } as any);
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
    this.formElements.publicKeyHashField.value = '';
    this.formElements.newRecipientInfo.classList.add('d-none');
    this.formElements.newRecipientKeyWarning.classList.add('d-none');
    this.formElements.recipientKeyNotFoundError.classList.add('d-none');
    this.updateSendButtonState();
  }

  private async handleRecipientPublicKeyFetch() {
    try {
      this.formElements.publicKeyHashField.value = '';

      const keyData = await SecurityUtils.useRecipientPublicKey(
        this.formElements.recipientInput.value,
      );

      this.recipientPublicKey = keyData.importedPublicKey;

      // show public key hash fingerprint
      this.formElements.publicKeyHashField.value = keyData.publicKeyHash;

      // show banner depending if recipient or key is new or unknown
      if (!keyData.isKnownRecipient) {
        this.formElements.newRecipientInfo.classList.remove('d-none');
      } else if (!keyData.isTrustedRecipientKey) {
        this.formElements.newRecipientKeyWarning.classList.remove('d-none');
      }
      this.updateSendButtonState();
    } catch {
      this.formElements.recipientKeyNotFoundError.classList.remove('d-none');
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
        fileText.textContent = `Selected: ${this.selectedFile.name} (${this.formatFileSize(this.selectedFile.size)})`;
      }

      // Auto-fill subject if empty
      if (!this.formElements.subjectInput.value) {
        this.formElements.subjectInput.value = this.selectedFile.name;
      }
    }
    this.updateSendButtonState();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async handleSubmit(): Promise<void> {
    // Validation
    if (!this.selectedFile) {
      alert('Please select a file to transfer.');
      return;
    }

    const recipientUsername = this.formElements.recipientInput.value.trim();

    const subject = this.formElements.subjectInput.value.trim();

    if (!recipientUsername || !subject) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      // Disable send button during processing
      this.formElements.sendButton.disabled = true;
      this.formElements.sendButton.textContent = 'Encrypting and uploading...';

      // Step 1: Create the transfer
      const aesKey = await FileEncryption.generateAESKey();
      const wrappedAesKey = await FileEncryption.wrapAESKey(
        aesKey,
        this.recipientPublicKey!,
      );

      const transfer = await this.createTransfer(
        wrappedAesKey,
        recipientUsername,
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
      alert('Failed to create transfer. Please try again.');
    } finally {
      // Re-enable send button
      this.formElements.sendButton.disabled = false;
      this.formElements.sendButton.textContent = 'Send file(s)';
    }
  }

  private async createTransfer(
    wrappedAesKey: ArrayBuffer,
    recipientUsername: string,
    subject: string,
  ): Promise<{ id: number }> {
    // Create digital signature
    const signatureSender = await this.createMockDigitalSignature();

    const payload = {
      filename: this.selectedFile!.name,
      subject: subject,
      receiver: recipientUsername,
      symmetric_key_encrypted: this.arrayBufferToBase64(wrappedAesKey),
      signature_sender: signatureSender,
    };

    return callApi('POST', '/transfer/new', payload);
  }

  private async sendChunksToServer(
    encryptedChunks: StreamChunk,
    transferId: number,
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
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async createMockDigitalSignature(): Promise<string> {
    // TODO: TO DELETE and replace with real sender signature with recipient verification on server to server transfer
    const mockData = `MOCK_SIGNATURE_${Date.now()}_${Math.random()}`;
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(mockData),
    );
    return this.arrayBufferToBase64(hashBuffer);
  }
}

// Setup function called from the Pug template
export function setupNewTransfer(): void {
  document.addEventListener('DOMContentLoaded', () => {
    new TransferNewPage();
  });
}
