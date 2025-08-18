import { FileEncryption, StreamChunk } from './crypto/encryption.js';
import { KeyManager } from './crypto/key-manager.js';
import { callApi } from './utils/common.js';

interface ChunkData {
  chunkIndex: number;
  encryptedData: string;
  iv: string;
}

export class FileDownloader {
  private userPrivateKey: CryptoKey;

  constructor(userPrivateKey: CryptoKey) {
    this.userPrivateKey = userPrivateKey;
  }

  async downloadAndDecrypt(transferId: number): Promise<Uint8Array> {
    try {
      const transfer: {
        id: number;
        symmetric_key_encrypted: string;
        chunks: number[];
      } = await callApi('GET', `/transfer/${transferId}`);

      console.log('Raw server response:', transfer);

      const chunks: ChunkData[] = await Promise.all(
        transfer.chunks.map((chunk) => {
          return callApi<void, ChunkData>(
            'GET',
            `/transfer/${transferId}/chunk/${chunk}`,
          );
        }),
      );

      console.log(
        `Fetched transfer ${transferId} with ${chunks.length} chunks`,
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
    }
  }

  async downloadFile(transferId: number, filename: string): Promise<void> {
    try {
      const decryptedData = await this.downloadAndDecrypt(transferId);

      // Create blob and trigger download
      const blob = new Blob([new Uint8Array(decryptedData)]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      console.log(`Downloaded file: ${filename}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`File download failed: ${message}`);
      throw error;
    }
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

  static createDownloader(userPrivateKey: CryptoKey): FileDownloader {
    return new FileDownloader(userPrivateKey);
  }
}
