import { SecurityUtils } from './security-utils';

export interface EncryptedData {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}

/**
 * Essential file encryption using AES256-GCM
 */
export class FileEncryption {
  /**
   * Generate AES key for file encryption
   */
  static async generateAESKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: SecurityUtils.AES_LENGTH },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Encrypt data with AES-GCM
   */
  static async encryptData(
    data: ArrayBuffer,
    key: CryptoKey,
  ): Promise<EncryptedData> {
    const iv = SecurityUtils.generateIV();

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data,
    );

    return { ciphertext, iv };
  }

  /**
   * Decrypt data with AES-GCM
   */
  static async decryptData(
    encryptedData: EncryptedData,
    key: CryptoKey,
  ): Promise<ArrayBuffer> {
    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: encryptedData.iv },
      key,
      encryptedData.ciphertext,
    );
  }

  /**
   * Encrypt file
   */
  static async encryptFile(file: File, key: CryptoKey): Promise<EncryptedData> {
    const fileBuffer = await file.arrayBuffer();
    return await this.encryptData(fileBuffer, key);
  }

  /**
   * Decrypt file
   */
  static async decryptFile(
    encryptedData: EncryptedData,
    key: CryptoKey,
    originalName: string,
    mimeType: string,
  ): Promise<File> {
    const decryptedBuffer = await this.decryptData(encryptedData, key);
    return new File([decryptedBuffer], originalName, { type: mimeType });
  }
}
