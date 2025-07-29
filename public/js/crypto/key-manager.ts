import { SecurityUtils } from './security-utils';

export interface EncryptedPrivateKey {
  encryptedData: ArrayBuffer;
  salt: Uint8Array;
  iv: Uint8Array;
}

/**
 * Essential key management operations
 */
export class KeyManager {
  /**
   * Generate RSA key pair for encryption
   */
  static async generateRSAKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: SecurityUtils.RSA_MODULUS,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Derive key from password using PBKDF2
   */
  static async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
  ): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: SecurityUtils.PBKDF_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: SecurityUtils.AES_LENGTH },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Encrypt private key with password
   */
  static async encryptPrivateKey(
    privateKey: CryptoKey,
    password: string,
  ): Promise<EncryptedPrivateKey> {
    const salt = SecurityUtils.generateSalt();
    const iv = SecurityUtils.generateIV();

    const derivedKey = await this.deriveKeyFromPassword(password, salt);
    const privateKeyData = await crypto.subtle.exportKey(
      'pkcs8',
      privateKey,
    );

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      privateKeyData,
    );

    SecurityUtils.clearSensitiveData(new Uint8Array(privateKeyData));

    return { encryptedData, salt, iv };
  }

  /**
   * Decrypt private key with password
   */
  static async decryptPrivateKey(
    encrypted: EncryptedPrivateKey,
    password: string,
  ): Promise<CryptoKey> {
    const derivedKey = await this.deriveKeyFromPassword(
      password,
      encrypted.salt,
    );

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: encrypted.iv },
      derivedKey,
      encrypted.encryptedData,
    );

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      decryptedData,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt'],
    );

    SecurityUtils.clearSensitiveData(new Uint8Array(decryptedData));

    return privateKey;
  }

  // TODO - Export/Import keypair with Wrapkey
}
