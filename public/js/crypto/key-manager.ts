import { SecurityUtils } from './security-utils';

export interface EncryptedPrivateKey {
  encryptedData: ArrayBuffer;
  salt: Uint8Array;
  iv: Uint8Array;
}

// TODO - verify that the exported keys are compatible with the server endpoints
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
      ['wrapKey', 'unwrapKey'],
    );
  }

  /**
   * Derive key from password using PBKDF2
   * @param {string} password - Password used to derive key
   * @param {Uint8Array} salt - Salt used to derive key
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
   * @param {CryptoKey} privateKey - Private key to encrypt before sending to server
   * @param {password} password - Password used to derive key
   */
  static async encryptPrivateKey(
    privateKey: CryptoKey,
    password: string,
  ): Promise<EncryptedPrivateKey> {
    const salt = SecurityUtils.generateSalt();
    const iv = SecurityUtils.generateIV();

    const derivedKey = await this.deriveKeyFromPassword(password, salt);
    const privateKeyData = await crypto.subtle.exportKey('pkcs8', privateKey);

    const encryptedData: ArrayBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      privateKeyData,
    );

    SecurityUtils.clearSensitiveData(new Uint8Array(privateKeyData));

    return { encryptedData, salt, iv };
  }

  /**
   * Decrypt private key with password
   * @param encryptedData - Encrypted private keys with IV and Salt
   * @param password
   */
  static async decryptPrivateKey(
    encryptedData: EncryptedPrivateKey,
    password: string,
  ): Promise<CryptoKey> {
    const derivedKey = await this.deriveKeyFromPassword(
      password,
      encryptedData.salt,
    );

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: encryptedData.iv },
      derivedKey,
      encryptedData.encryptedData,
    );

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      decryptedData,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['unwrapKey'],
    );

    SecurityUtils.clearSensitiveData(new Uint8Array(decryptedData));

    return privateKey;
  }

  /**
   * Encrypt AES key with RSA public key (Key Exchange)
   * @param aesKey - AES Key to encrypt (wrap) before sending it over the wire
   * @param publicKey - Key used to encrypt (wrap) AES key
   */
  static async wrapAESKey(
    aesKey: CryptoKey,
    publicKey: CryptoKey,
  ): Promise<ArrayBuffer> {
    return await crypto.subtle.wrapKey('raw', aesKey, publicKey, {
      name: 'RSA-OAEP',
    });
  }

  /**
   * Decrypt AES key with RSA private key (Key Exchange)
   * @param wrappedKey - AES Key to decrypt (unwrap) before sending it over the wire
   * @param privateKey - Key used to decrypt (unwrap) AES key
   */
  static async unwrapAESKey(
    wrappedKey: ArrayBuffer,
    privateKey: CryptoKey,
  ): Promise<CryptoKey> {
    return await crypto.subtle.unwrapKey(
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
