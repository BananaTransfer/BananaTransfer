import { FileEncryption, StreamChunk } from './encryption.js';
import { KeyManager } from './key-manager.js';
import { SecurityUtils } from './security-utils.js';

interface TransferFormElements {
  recipientInput: HTMLInputElement;
  fileInput: HTMLInputElement;
  subjectInput: HTMLInputElement;
  sendButton: HTMLButtonElement;
  fileUploadArea: HTMLElement;
  expectedHashInput: HTMLInputElement;
}

class TransferNewPage {
  private formElements!: TransferFormElements;
  private selectedFile: File | null = null;
  private recipientPublicKey: CryptoKey | null = null;

  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    void this.initializeMockedKeys();
  }

  private initializeElements(): void {
    this.formElements = {
      recipientInput: document.getElementById('recipient') as HTMLInputElement,
      fileInput: document.getElementById('fileInput') as HTMLInputElement,
      subjectInput: document.getElementById('subject') as HTMLInputElement,
      sendButton: document.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement,
      fileUploadArea: document.querySelector(
        '.file-upload-area',
      ) as HTMLElement,
      expectedHashInput: document.getElementById(
        'expectedHash',
      ) as HTMLInputElement,
    };
  }

  // TODO: Those are Mock keys for testing replace by using real key
  private async initializeMockedKeys(): Promise<void> {
    try {
      // Generate a mock RSA key pair for testing
      const mockKeyPair = await KeyManager.generateRSAKeyPair();
      this.recipientPublicKey = mockKeyPair.publicKey;

      console.log('Using mocked keys for testing');
    } catch (error) {
      console.error('Error initializing mocked keys:', error);
    }
  }

  private attachEventListeners(): void {
    // File upload area click handler
    this.formElements.fileUploadArea.addEventListener('click', () => {
      this.formElements.fileInput.click();
    });

    // File selection handler
    this.formElements.fileInput.addEventListener('change', (event) => {
      this.handleFileSelection(event);
    });

    // Recipient input handler (auto-fill with mock for testing)
    this.formElements.recipientInput.addEventListener('focus', () => {
      if (!this.formElements.recipientInput.value) {
        this.formElements.recipientInput.value = 'testuser';
      }
    });

    // Send button handler
    this.formElements.sendButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.handleSubmit();
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

    if (!this.recipientPublicKey) {
      alert('Mock public key not initialized. Please refresh the page.');
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

      // Step 1: Encrypt file and get encrypted chunks + wrapped key
      const { wrappedAesKey, encryptedChunks } =
        await FileEncryption.encryptFile(
          this.recipientPublicKey,
          this.selectedFile,
        );

      console.log(`File encrypted into ${encryptedChunks.length} chunks`);

      // Step 2: Send chunks directly to server
      await this.sendChunksToServer(
        encryptedChunks,
        wrappedAesKey,
        recipientUsername,
        subject,
      );

      // Success - redirect to transfers list
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

  private async sendChunksToServer(
    encryptedChunks: StreamChunk[],
    wrappedAesKey: ArrayBuffer,
    recipientUsername: string,
    subject: string,
  ): Promise<void> {
    // Sort chunks to ensure correct order
    const sortedChunks = [...encryptedChunks].sort(
      (a, b) => a.chunkIndex - b.chunkIndex,
    );

    // Create digital signature (mocked for Step 1)
    const signatureSender = await this.createMockDigitalSignature();

    // Prepare transfer metadata
    const transferMetadata = {
      filename: this.selectedFile!.name,
      subject: subject,
      recipientUsername: recipientUsername,
      symmetricKeyEncrypted: this.arrayBufferToBase64(wrappedAesKey),
      signatureSender: signatureSender,
      totalFileSize: this.selectedFile!.size,
      totalChunks: sortedChunks.length,
      chunkSize: SecurityUtils.CHUNK_SIZE,
    };

    // Send chunks sequentially to the server
    for (let i = 0; i < sortedChunks.length; i++) {
      const chunk = sortedChunks[i];

      // Update progress
      this.formElements.sendButton.textContent = `Uploading chunk ${i + 1}/${sortedChunks.length}...`;

      // Prepare JSON payload
      const payload: any = {
        chunkData: this.arrayBufferToBase64(chunk.encryptedData),
        chunkIndex: chunk.chunkIndex,
        isLastChunk: chunk.isLastChunk,
        iv: this.arrayBufferToBase64(chunk.iv),
      };

      // Add metadata on first chunk
      if (i === 0) {
        Object.assign(payload, transferMetadata);
      }

      // Get CSRF token and add to payload
      const csrfToken = (document.getElementById('_csrf') as HTMLInputElement)
        ?.value;
      if (csrfToken) {
        payload._csrf = csrfToken;
      }

      const response = await fetch('/transfer/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload chunk ${i + 1}: ${errorText}`);
      }

      console.log(
        `Chunk ${i + 1}/${sortedChunks.length} uploaded successfully`,
      );
    }

    console.log('All chunks uploaded successfully');
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
    // Create a mock signature for Step 1 testing
    const mockData = `MOCK_SIGNATURE_${Date.now()}_${Math.random()}`;
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(mockData),
    );
    return this.arrayBufferToBase64(hashBuffer);
  }
}

// Setup function called from the Pug template
export function setupListPage(): void {
  document.addEventListener('DOMContentLoaded', () => {
    new TransferNewPage();
  });
}
