import { FileEncryption, StreamChunk } from './encryption.js';
import { KeyManager } from './key-manager.js';

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
      // Fetch transfer data and chunks from server
      const response = await fetch(`/transfer/${transferId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Include authentication cookies
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to fetch transfer: ${response.statusText}`);
      }

      const transfer = (await response.json()) as {
        id: number;
        symmetric_key_encrypted: string;
        chunks: number[];
      };
      console.log('Raw server response:', transfer);

      const chunks: ChunkData[] = await Promise.all(
        transfer.chunks.map((chunk) => {
          return fetch(`/transfer/${transferId}/chunk/${chunk}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'same-origin', // Include authentication cookies
          }).then((res) => {
            if (!res.ok) throw new Error('could not fetch chunk');

            return res.json() as Promise<ChunkData>;
          });
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

      // Convert chunks to the format expected by FileEncryption.decryptChunks
      const streamChunks: StreamChunk[] = chunks.map((chunk, index) => ({
        chunkIndex: chunk.chunkIndex,
        encryptedData: this.base64ToArrayBuffer(chunk.encryptedData),
        iv: this.base64ToUint8Array(chunk.iv),
        isLastChunk: index === chunks.length - 1,
      }));

      // Sort chunks by index to ensure proper order
      streamChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

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

  static async createDownloader(
    userPrivateKey: CryptoKey,
  ): Promise<FileDownloader> {
    return new FileDownloader(userPrivateKey);
  }
}
