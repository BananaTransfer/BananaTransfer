import { SecurityUtils } from './security-utils';

/**
 * Essential key exchange operations using RSA
 */
export class KeyExchange {
  /**
   * Encrypt AES key with RSA public key
   */
  static async encryptAESKey(
    aesKey: CryptoKey,
    publicKey: CryptoKey,
  ): Promise<ArrayBuffer> {
    return await window.crypto.subtle.wrapKey('raw', aesKey, publicKey, {
      name: 'RSA-OAEP',
    });
  }

  /**
   * Decrypt AES key with RSA private key
   */
  static async decryptAESKey(
    wrappedKey: ArrayBuffer,
    privateKey: CryptoKey,
  ): Promise<CryptoKey> {
    return await window.crypto.subtle.unwrapKey(
      'raw',
      wrappedKey,
      privateKey,
      { name: 'RSA-OAEP' },
      { name: 'AES-GCM', length: SecurityUtils.AES_LENGTH },
      true,
      ['encrypt', 'decrypt'],
    );
  }
}
