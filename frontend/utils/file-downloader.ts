import { FileEncryption, StreamChunk } from '../crypto/encryption.js';
import { KeyManager } from '../crypto/key-manager.js';
import { callApi, createProgressBarHandler } from '../utils/common.js';

// File System Access API type definitions
interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    showSaveFilePicker?: (
      options: SaveFilePickerOptions,
    ) => Promise<FileSystemFileHandle>;
  }
}

interface ChunkData {
  chunkIndex: number;
  encryptedData: string;
  iv: string;
}

interface Transfer {
  id: string;
  symmetric_key_encrypted: string;
  chunks: number[];
  filename: string;
  size: string;
}

export class FileDownloader {
  private static readonly STREAMING_THRESHOLD_BYTES = 50 * 1024 * 1024; // 50MB
  private userPrivateKey: CryptoKey;

  constructor(userPrivateKey: CryptoKey) {
    this.userPrivateKey = userPrivateKey;
  }

  private async getTransfer(transferId: string): Promise<Transfer> {
    return await callApi('GET', `/transfer/${transferId}`);
  }

  async downloadAndDecrypt(transfer: Transfer): Promise<Uint8Array> {
    const progressBar = createProgressBarHandler('progress-bar-' + transfer.id);
    const btnGroupList = document.getElementsByClassName(
      'action-' + transfer.id,
    ) as HTMLCollectionOf<HTMLButtonElement>;

    const setBtnGroupDisplay = (display: string | null) => {
      for (const btn of btnGroupList) {
        btn.style.setProperty('display', display, 'important');
      }
    };

    try {
      progressBar.setVisible(true);
      progressBar.setProgress(0);
      setBtnGroupDisplay('none');

      let progress = 0;
      const chunkCount = transfer.chunks.length;

      const chunks: ChunkData[] = await Promise.all(
        transfer.chunks.map((chunk) => {
          return callApi<void, ChunkData>(
            'GET',
            `/transfer/${transfer.id}/chunk/${chunk}`,
          ).finally(() => {
            progress++;
            progressBar.setProgress((progress / chunkCount) * 100);
          });
        }),
      );

      console.log(
        `Fetched transfer ${transfer.id} with ${chunks.length} chunks`,
      );

      // Unwrap AES key with user's private key
      const wrappedAESKey = this.base64ToArrayBuffer(
        transfer.symmetric_key_encrypted,
      );
      const unwrappedAESKey = await KeyManager.unwrapAESKey(
        wrappedAESKey,
        this.userPrivateKey,
      );
      console.log('AES key unwrapped successfully');

      // Sort chunks by index to ensure proper order
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

      // Convert chunks to the format expected by FileEncryption.decryptChunks
      const streamChunks: StreamChunk[] = chunks.map((chunk, index) => ({
        chunkIndex: chunk.chunkIndex,
        encryptedData: this.base64ToArrayBuffer(chunk.encryptedData),
        iv: this.base64ToUint8Array(chunk.iv),
        isLastChunk: index === chunks.length - 1,
      }));

      // Decrypt chunks using existing FileEncryption method
      const decryptedData = await FileEncryption.decryptChunks(
        streamChunks,
        unwrappedAESKey,
      );
      console.log(`Decryption completed successfully`);

      return decryptedData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Download and decryption failed: ${message}`);
      throw error;
    } finally {
      progressBar.setVisible(false);
      setBtnGroupDisplay(null);
    }
  }

  async downloadFile(transferId: string): Promise<void> {
    try {
      const transfer = await this.getTransfer(transferId);

      console.log(
        `Transfer: ${transfer.chunks.length} chunks, ${Math.round(Number(transfer.size) / (1024 * 1024))}MB`,
      );
      console.log(
        `File System Access API available: ${'showSaveFilePicker' in window}`,
      );

      // Check if file is too large
      if (this.shouldUseStreaming(transfer)) {
        // For browsers with File System Access API
        if ('showSaveFilePicker' in window) {
          console.log('Using File System Access API (direct streaming)');
          await this.downloadWithFileSystemAPI(transfer);
        } else {
          throw new Error(
            'File too large for this browser. Please use a modern chromium based browser that supports File System Access API.',
          );
        }
      } else {
        await this.downloadWithBlob(transfer);
      }

      console.log(`Downloaded file: ${transfer.filename}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`File download failed: ${message}`);
      throw error;
    }
  }

  private shouldUseStreaming(transfer: Transfer): boolean {
    // Use streaming for files larger than 50MB
    return Number(transfer.size) > FileDownloader.STREAMING_THRESHOLD_BYTES;
  }

  private async downloadWithFileSystemAPI(transfer: Transfer): Promise<void> {
    try {
      console.log('Using File System Access API for streaming download');

      // Ask user where to save the file
      const fileHandle = await window.showSaveFilePicker!({
        suggestedName: transfer.filename,
        types: [
          {
            description: 'Files',
            accept: { '*/*': [] },
          },
        ],
      });

      const writable = await fileHandle.createWritable();

      // Unwrap AES key
      const wrappedAESKey = this.base64ToArrayBuffer(
        transfer.symmetric_key_encrypted,
      );
      const unwrappedAESKey = await KeyManager.unwrapAESKey(
        wrappedAESKey,
        this.userPrivateKey,
      );
      console.log('AES key unwrapped successfully');

      // Sort chunk indices to ensure proper order
      const sortedChunkIndices = [...transfer.chunks].sort((a, b) => a - b);
      console.log(
        `Streaming ${sortedChunkIndices.length} chunks directly to file`,
      );

      // Process chunks sequentially
      for (let i = 0; i < sortedChunkIndices.length; i++) {
        const chunkIndex = sortedChunkIndices[i];
        console.log(
          `Processing chunk ${i + 1}/${sortedChunkIndices.length} (${Math.round(((i + 1) / sortedChunkIndices.length) * 100)}%)`,
        );

        // Download single chunk
        const chunkData: ChunkData = await callApi<void, ChunkData>(
          'GET',
          `/transfer/${transfer.id}/chunk/${chunkIndex}`,
        );

        // Decrypt chunk immediately
        const decryptedChunk = await this.decryptSingleChunk(
          chunkData.encryptedData,
          chunkData.iv,
          unwrappedAESKey,
        );

        // Stream directly to file
        await writable.write(decryptedChunk);
      }

      await writable.close();
      console.log('File streamed successfully to disk');
    } catch (error) {
      console.error('File System API download failed:', error);
      throw error;
    }
  }

  private async downloadWithBlob(transfer: Transfer): Promise<void> {
    console.log('Using blob download (original approach)');

    const transferData = await this.downloadAndDecrypt(transfer);

    const blob = new Blob([new Uint8Array(transferData)]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = transfer.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decryptSingleChunk(
    encryptedDataBase64: string,
    ivBase64: string,
    key: CryptoKey,
  ): Promise<Uint8Array> {
    const encryptedData = this.base64ToArrayBuffer(encryptedDataBase64);
    const iv = this.base64ToUint8Array(ivBase64);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      encryptedData as BufferSource,
    );

    return new Uint8Array(decryptedData);
  }

  static createDownloader(userPrivateKey: CryptoKey): FileDownloader {
    return new FileDownloader(userPrivateKey);
  }
}
