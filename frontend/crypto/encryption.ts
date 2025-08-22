import { SecurityUtils } from './security-utils.js';
import { KeyManager } from './key-manager.js';

export interface StreamChunk {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  chunkIndex: number;
  isLastChunk: boolean;
}

export interface StreamingEncryptor {
  processChunk(chunk: ArrayBuffer, isLastChunk?: boolean): Promise<StreamChunk>;
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
   * Wrap the provided AWS key with the provided publicKey
   * @param aesKey
   * @param publicKey
   */
  static async wrapAESKey(
    aesKey: CryptoKey,
    publicKey: CryptoKey,
  ): Promise<ArrayBuffer> {
    return KeyManager.wrapAESKey(aesKey, publicKey);
  }

  /**
   * Main encryption method used to encrypt a file in a chunked way
   * @param aesKey
   * @param file
   */
  static async encryptFile(
    aesKey: CryptoKey,
    file: File,
    chunkHandler: (chunk: StreamChunk) => Promise<void>,
  ): Promise<void> {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);

    const fileSize = file.size;
    const step = SecurityUtils.CHUNK_SIZE;
    let position = 0;

    while (position < fileSize) {
      let end = position + step;
      if (end > fileSize) {
        end = fileSize;
      }

      const chunk = file.slice(position, end, 'application/octet-stream');

      const result = await encryptor.processChunk(
        await chunk.arrayBuffer(),
        end >= fileSize,
      );

      await chunkHandler(result);
      position += step;
    }
  }

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
  private chunkIndex: number;

  constructor(key: CryptoKey) {
    this.key = key;
    this.chunkIndex = 0;
  }

  /**
   * Process incoming data chunk and encrypt when buffer is full
   * @param chunk - Raw data chunk from upload stream
   * @param isLastChunk - Whether this is the final chunk
   */
  async processChunk(
    chunk: ArrayBuffer,
    isLastChunk = false,
  ): Promise<StreamChunk> {
    // Generate unique IV for this chunk
    const iv = SecurityUtils.generateIV();

    // Encrypt chunk
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      this.key,
      chunk,
    );

    // Create result
    const result: StreamChunk = {
      encryptedData,
      iv,
      chunkIndex: this.chunkIndex++,
      isLastChunk: isLastChunk,
    };

    return result;
  }
}
