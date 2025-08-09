import { SecurityUtils } from './security-utils.js';
import { KeyManager } from './key-manager.js';

export interface StreamChunk {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  chunkIndex: number;
  isLastChunk: boolean;
}

export interface StreamingEncryptor {
  processChunk(
    chunk: Uint8Array,
    isLastChunk?: boolean,
  ): Promise<StreamChunk | null>;
  finalize(): Promise<{ totalChunks: number; chunkSize: number }>;
}

/**
 * Parallel streaming file encryption using AES256-GCM
 */
export class FileEncryption {
  /**
   * Generate AES key for file encryption
   */
  static async generateAESKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: SecurityUtils.AES_LENGTH },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Main encryption method used to returned the encrypted file with its associated wrapped key
   * @param publicKey
   * @param file
   */
  static async encryptFile(
    publicKey: CryptoKey,
    file: File,
  ): Promise<{ wrappedAesKey: ArrayBuffer; encryptedChunks: StreamChunk[] }> {
    const aesKey: CryptoKey = await this.generateAESKey();
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);

    const wrappedAesKey: ArrayBuffer = await KeyManager.wrapAESKey(
      aesKey,
      publicKey,
    );

    const encryptedChunks: StreamChunk[] = [];

    const reader = file.stream().getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();

        const result = await encryptor.processChunk(
          value || new Uint8Array(0),
          done,
        );
        if (result) {
          encryptedChunks.push(result);
        }

        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }
    return { wrappedAesKey, encryptedChunks };
  }

  // TODO - Interface for decrypting with parameters: encryptedPrivateKey, password (When are we asking it), wrappedAesKey, encryptedChunks

  /**
   * Create streaming encryptor for parallel upload + encryption
   * @param {CryptoKey} key - AES key for file encryption
   */
  static createStreamingEncryptor(key: CryptoKey): StreamingEncryptor {
    return new ParallelStreamingEncryptor(key);
  }

  /**
   * Decrypt encrypted chunks back to original file data
   * @param {StreamChunk[]} encryptedChunks - Received encrypted chunks to decrypt
   * @param {CryptoKey} key - AES key for file encryption
   */
  static async decryptChunks(
    encryptedChunks: StreamChunk[],
    key: CryptoKey,
  ): Promise<Uint8Array> {
    // Validate input
    if (!encryptedChunks || encryptedChunks.length === 0) {
      throw new Error('No encrypted chunks provided');
    }

    // Sort chunks by index to ensure correct order
    const sortedChunks = [...encryptedChunks].sort(
      (a, b) => a.chunkIndex - b.chunkIndex,
    );

    // Verify chunk completeness and integrity
    const lastChunk = sortedChunks.find((chunk) => chunk.isLastChunk);
    if (!lastChunk) {
      throw new Error('No last chunk found, file may be incomplete');
    }

    const expectedChunkCount = lastChunk.chunkIndex + 1;
    if (sortedChunks.length !== expectedChunkCount) {
      throw new Error(
        `Missing chunks: received ${sortedChunks.length}, expected ${expectedChunkCount}`,
      );
    }

    // Verify sequential chunk indices
    for (let i = 0; i < expectedChunkCount; i++) {
      if (sortedChunks[i].chunkIndex !== i) {
        throw new Error(`Missing chunk with index ${i}`);
      }
    }

    const decryptedChunks: Uint8Array[] = [];

    // Decrypt each chunk atomically
    for (const chunk of sortedChunks) {
      try {
        const decryptedData = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: chunk.iv as BufferSource },
          key,
          chunk.encryptedData as BufferSource,
        );

        decryptedChunks.push(new Uint8Array(decryptedData));
      } catch (error) {
        throw new Error(
          `Failed to decrypt chunk ${chunk.chunkIndex}: ${error}`,
        );
      }
    }

    // Combine all decrypted chunks
    const totalLength = decryptedChunks.reduce(
      (sum, chunk) => sum + chunk.length,
      0,
    );
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const chunk of decryptedChunks) {
      result.set(chunk, offset);
      offset += chunk.length;

      // Clear sensitive data
      SecurityUtils.clearSensitiveData(chunk);
    }

    return result;
  }
}

/**
 * Parallel streaming encryptor that processes chunks as they arrive
 */
class ParallelStreamingEncryptor implements StreamingEncryptor {
  private readonly key: CryptoKey;
  private buffer: Uint8Array;
  private chunkIndex: number;
  private readonly chunkSize: number;

  constructor(key: CryptoKey) {
    this.key = key;
    this.buffer = new Uint8Array(0);
    this.chunkIndex = 0;
    this.chunkSize = SecurityUtils.CHUNK_SIZE;
  }

  /**
   * Process incoming data chunk and encrypt when buffer is full
   * @param chunk - Raw data chunk from upload stream
   * @param isLastChunk - Whether this is the final chunk
   */
  async processChunk(
    chunk: Uint8Array,
    isLastChunk = false,
  ): Promise<StreamChunk | null> {
    // Append new data to buffer
    const newBuffer = new Uint8Array(this.buffer.length + chunk.length);
    newBuffer.set(this.buffer);
    newBuffer.set(chunk, this.buffer.length);
    this.buffer = newBuffer;

    // Process complete chunks
    if (
      this.buffer.length >= this.chunkSize ||
      (isLastChunk && this.buffer.length > 0)
    ) {
      const dataToEncrypt = isLastChunk
        ? this.buffer
        : this.buffer.slice(0, this.chunkSize);

      // Generate unique IV for this chunk
      const iv = SecurityUtils.generateIV();

      // Encrypt chunk
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        this.key,
        dataToEncrypt as BufferSource,
      );

      // Create result
      const result: StreamChunk = {
        encryptedData,
        iv,
        chunkIndex: this.chunkIndex++,
        isLastChunk: isLastChunk && this.buffer.length <= this.chunkSize,
      };

      // Update buffer (remove processed data)
      if (!isLastChunk) {
        this.buffer = this.buffer.slice(this.chunkSize);
      } else {
        this.buffer = new Uint8Array(0);
      }

      // Clear sensitive data
      SecurityUtils.clearSensitiveData(dataToEncrypt);

      return result;
    }

    return null; // Not enough data to process yet
  }

  // TODO - Test if finalize() is really necessary after all or just redundant
  /**
   * Finalize encryption and return metadata
   */
  async finalize(): Promise<{ totalChunks: number; chunkSize: number }> {
    // Process any remaining data
    if (this.buffer.length > 0) {
      await this.processChunk(new Uint8Array(0), true);
    }

    return {
      totalChunks: this.chunkIndex,
      chunkSize: this.chunkSize,
    };
  }
}
