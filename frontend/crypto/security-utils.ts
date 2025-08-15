/**
 * Security utilities for cryptographic operations
 */

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
}
