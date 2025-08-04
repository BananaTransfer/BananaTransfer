export class SecurityUtils {
    static PBKDF_ITERATIONS = 100000;
    static DEFAULT_IV_LENGTH = 12;
    static DEFAULT_SALT_LENGTH = 32;
    static RSA_MODULUS = 4096;
    static AES_LENGTH = 256;
    static CHUNK_SIZE = 1024 * 1024;
    static GCM_AUTH_TAG_SIZE = 16;
    static MAX_RANDOM_BYTES = 65536;
    static generateSecureRandom(length) {
        if (!crypto || !crypto.getRandomValues) {
            throw new Error('Secure random generation not supported');
        }
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
    }
    static generateSalt(length = this.DEFAULT_SALT_LENGTH) {
        return this.generateSecureRandom(length);
    }
    static generateIV(length = this.DEFAULT_IV_LENGTH) {
        return this.generateSecureRandom(length);
    }
    static clearSensitiveData(data) {
        const bytes = new Uint8Array(data);
        bytes.fill(0);
        const MAX_RANDOM_BYTES = this.MAX_RANDOM_BYTES;
        for (let i = 0; i < bytes.length; i += MAX_RANDOM_BYTES) {
            const chunkEnd = Math.min(i + MAX_RANDOM_BYTES, bytes.length);
            const chunk = bytes.subarray(i, chunkEnd);
            crypto.getRandomValues(chunk);
        }
        bytes.fill(0);
    }
}
//# sourceMappingURL=security-utils.js.map