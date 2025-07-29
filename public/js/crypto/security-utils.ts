/**
 * Security utilities for cryptographic operations
 */

export class SecurityUtils {
  public static readonly DEFAULT_IV_LENGTH: number = 12;
  public static readonly DEFAULT_SALT_LENGTH: number = 32;
  public static readonly RSA_MODULUS: number = 4096;
  public static readonly PBKDF_ITERATIONS: number = 100000;
  public static readonly AES_LENGTH: number = 256;
  /**
   * Generate cryptographically secure random bytes
   * @param {number} length - Number of bytes to generate
   * @returns {Uint8Array} Secure random bytes
   */
  static generateSecureRandom(length: number) {
    if (!crypto || !crypto.getRandomValues) {
      throw new Error('Secure random generation not supported');
    }

    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }
  /**
   * Generate a random salt for key derivation
   * @param {number} length - Salt length in bytes
   * @returns {Uint8Array} Random salt
   */
  static generateSalt(length: number = this.DEFAULT_SALT_LENGTH) {
    return this.generateSecureRandom(length);
  }
  /**
   * Generate a random initialization vector
   * @param {number} length - IV length in bytes
   * @returns {Uint8Array} Random IV
   */
  static generateIV(length: number = this.DEFAULT_IV_LENGTH) {
    return this.generateSecureRandom(length);
  }
  /**
   * Clear sensitive data from memory
   */
  static clearSensitiveData(data: Uint8Array | ArrayBuffer): void {
    const bytes = new Uint8Array(data);
    bytes.fill(0);
    crypto.getRandomValues(bytes);
    bytes.fill(0);
  }
}
