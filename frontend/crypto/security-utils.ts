/**
 * Security utilities for cryptographic operations
 */
import { callApi, showModal } from '../utils/common';
import { KeyManager } from './key-manager';

export class SecurityUtils {
  public static readonly PBKDF_ITERATIONS: number = 100000;
  // All following sizes are in Bytes
  public static readonly DEFAULT_IV_LENGTH: number = 12;
  public static readonly DEFAULT_SALT_LENGTH: number = 32;
  public static readonly RSA_MODULUS: number = 4096;
  public static readonly AES_LENGTH: number = 256;
  public static readonly CHUNK_SIZE: number = 512 * 1024; // 512KB
  public static readonly GCM_AUTH_TAG_SIZE: number = 16;
  private static readonly MAX_RANDOM_BYTES: number = 65536;

  /**
   * Generate a random master password of specified length (default 64 chars)
   * Uses base64url charset for maximum compatibility
   */
  static generateMasterPassword(length: number = 64): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*?-';
    const bytes = this.generateSecureRandom(length);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[bytes[i] % charset.length];
    }
    return password;
  }

  /**
   * Generate cryptographically secure random bytes
   * @param {number} length - Number of bytes to generate
   * @returns {Uint8Array} - Secure random bytes
   */
  static generateSecureRandom(length: number): Uint8Array {
    if (!crypto || !crypto.getRandomValues) {
      throw new Error('Secure random generation not supported');
    }

    const bytes = new Uint8Array(new ArrayBuffer(length));
    crypto.getRandomValues(bytes);
    return bytes;
  }

  /**
   * Generate a random salt for key derivation
   * @param {number} length - Salt length in bytes
   * @returns {Uint8Array} - Random salt
   */
  static generateSalt(length: number = this.DEFAULT_SALT_LENGTH): Uint8Array {
    return this.generateSecureRandom(length);
  }

  /**
   * Generate a random initialization vector
   * @param {number} length - IV length in bytes
   * @returns {Uint8Array} - Random IV
   */
  static generateIV(length: number = this.DEFAULT_IV_LENGTH): Uint8Array {
    return this.generateSecureRandom(length);
  }

  /**
   * Clear sensitive data from memory
   * @param {Uint8Array | ArrayBuffer} data - Data to be deleted from memory
   */
  static clearSensitiveData(data: Uint8Array | ArrayBuffer): void {
    const bytes = new Uint8Array(data);
    bytes.fill(0);

    // crypto.getRandomValues has a 65,536 byte limit, so process in chunks
    const MAX_RANDOM_BYTES = this.MAX_RANDOM_BYTES;
    for (let i = 0; i < bytes.length; i += MAX_RANDOM_BYTES) {
      const chunkEnd = Math.min(i + MAX_RANDOM_BYTES, bytes.length);
      const chunk = bytes.subarray(i, chunkEnd);
      crypto.getRandomValues(chunk);
    }

    bytes.fill(0);
  }

  static async askUserMasterPassword(): Promise<string> {
    (
      document.getElementById('modalMasterPasswordText') as HTMLElement
    ).textContent = 'To execute this action we need your master password';

    const enteredMasterPassword = await showModal(
      'masterPasswordModal',
      'modalMasterPasswordInput',
      'modalMasterPasswordConfirmBtn',
      'modalMasterPasswordError',
    );
    // throw if master password entry canceled
    if (!enteredMasterPassword) throw new Error('The password is required.');
    return enteredMasterPassword;
  }

  /**
   * Method to use the current user's private key
   */
  static async useUserPrivateKey(): Promise<CryptoKey> {
    const privateKeyData: {
      private_key_encrypted: string;
      private_key_salt: string;
      private_key_iv: string;
    } = await callApi('GET', 'get/privatekey');

    const importedPrivateKey = KeyManager.importEncryptedPrivateKey(
      privateKeyData.private_key_encrypted,
      privateKeyData.private_key_salt,
      privateKeyData.private_key_iv,
    );

    const masterPassword = await this.askUserMasterPassword();

    return await KeyManager.decryptPrivateKey(
      importedPrivateKey,
      masterPassword,
    );
  }

  /**
   * Method to get the pub key associated with a user
   */
  static async useUserPublicKey(
    recipient: string,
  ): Promise<{ key: CryptoKey; isTrusted: boolean }> {
    const pubKeyData: { publicKey: string; isTrustedRecipient: boolean } =
      await callApi('GET', `/publickey/${recipient}`);

    return {
      key: await KeyManager.importPublicKey(pubKeyData.publicKey),
      isTrusted: pubKeyData.isTrustedRecipient,
    };
  }
}
