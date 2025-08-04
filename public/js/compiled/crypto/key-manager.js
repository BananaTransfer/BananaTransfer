import { SecurityUtils } from './security-utils.js';
export class KeyManager {
    static async generateRSAKeyPair() {
        return await crypto.subtle.generateKey({
            name: 'RSA-OAEP',
            modulusLength: SecurityUtils.RSA_MODULUS,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        }, true, ['wrapKey', 'unwrapKey']);
    }
    static async deriveKeyFromPassword(password, salt) {
        const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
        return await crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt,
            iterations: SecurityUtils.PBKDF_ITERATIONS,
            hash: 'SHA-256',
        }, keyMaterial, { name: 'AES-GCM', length: SecurityUtils.AES_LENGTH }, false, ['encrypt', 'decrypt']);
    }
    static async encryptPrivateKey(privateKey, password) {
        const salt = SecurityUtils.generateSalt();
        const iv = SecurityUtils.generateIV();
        const derivedKey = await this.deriveKeyFromPassword(password, salt);
        const privateKeyData = await crypto.subtle.exportKey('pkcs8', privateKey);
        const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, derivedKey, privateKeyData);
        SecurityUtils.clearSensitiveData(new Uint8Array(privateKeyData));
        return { encryptedData, salt, iv };
    }
    static async decryptPrivateKey(encryptedData, password) {
        const derivedKey = await this.deriveKeyFromPassword(password, encryptedData.salt);
        const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: encryptedData.iv }, derivedKey, encryptedData.encryptedData);
        const privateKey = await crypto.subtle.importKey('pkcs8', decryptedData, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['unwrapKey']);
        SecurityUtils.clearSensitiveData(new Uint8Array(decryptedData));
        return privateKey;
    }
    static async wrapAESKey(aesKey, publicKey) {
        return await crypto.subtle.wrapKey('raw', aesKey, publicKey, {
            name: 'RSA-OAEP',
        });
    }
    static async unwrapAESKey(wrappedKey, privateKey) {
        return await crypto.subtle.unwrapKey('raw', wrappedKey, privateKey, { name: 'RSA-OAEP' }, { name: 'AES-GCM', length: SecurityUtils.AES_LENGTH }, true, ['encrypt', 'decrypt']);
    }
}
//# sourceMappingURL=key-manager.js.map