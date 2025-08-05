import { SecurityUtils } from './security-utils';

describe('SecurityUtils', () => {
  describe('generateSecureRandom', () => {
    test('should generate random bytes of correct length', () => {
      const bytes = SecurityUtils.generateSecureRandom(32);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    test('should generate different values on subsequent calls', () => {
      const bytes1 = SecurityUtils.generateSecureRandom(16);
      const bytes2 = SecurityUtils.generateSecureRandom(16);

      expect(bytes1).not.toEqual(bytes2);
    });
  });

  describe('generateSalt', () => {
    test('should generate salt of default length', () => {
      const salt = SecurityUtils.generateSalt();

      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32);
    });

    test('should generate salt of custom length', () => {
      const salt = SecurityUtils.generateSalt(16);

      expect(salt.length).toBe(16);
    });

    test('should generate different salts', () => {
      const salt1 = SecurityUtils.generateSalt();
      const salt2 = SecurityUtils.generateSalt();

      expect(salt1).not.toEqual(salt2);
    });
  });

  describe('generateIV', () => {
    test('should generate IV of default length', () => {
      const iv = SecurityUtils.generateIV();

      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12); // Default for AES-GCM
    });

    test('should generate IV of custom length', () => {
      const iv = SecurityUtils.generateIV(16);

      expect(iv.length).toBe(16);
    });
  });
});
