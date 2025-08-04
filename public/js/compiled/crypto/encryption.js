import { SecurityUtils } from './security-utils.js';
import { KeyManager } from './key-manager.js';
export class FileEncryption {
    static async generateAESKey() {
        return await crypto.subtle.generateKey({ name: 'AES-GCM', length: SecurityUtils.AES_LENGTH }, true, ['encrypt', 'decrypt']);
    }
    static async encryptFile(publicKey, file) {
        const aesKey = await this.generateAESKey();
        const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
        const wrappedAesKey = await KeyManager.wrapAESKey(aesKey, publicKey);
        const encryptedChunks = [];
        const reader = file.stream().getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                const result = await encryptor.processChunk(value || new Uint8Array(0), done);
                if (result) {
                    encryptedChunks.push(result);
                }
                if (done)
                    break;
            }
        }
        finally {
            reader.releaseLock();
        }
        return { wrappedAesKey, encryptedChunks };
    }
    static createStreamingEncryptor(key) {
        return new ParallelStreamingEncryptor(key);
    }
    static async decryptChunks(encryptedChunks, key) {
        if (!encryptedChunks || encryptedChunks.length === 0) {
            throw new Error('No encrypted chunks provided');
        }
        const sortedChunks = [...encryptedChunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
        const lastChunk = sortedChunks.find((chunk) => chunk.isLastChunk);
        if (!lastChunk) {
            throw new Error('No last chunk found, file may be incomplete');
        }
        const expectedChunkCount = lastChunk.chunkIndex + 1;
        if (sortedChunks.length !== expectedChunkCount) {
            throw new Error(`Missing chunks: received ${sortedChunks.length}, expected ${expectedChunkCount}`);
        }
        for (let i = 0; i < expectedChunkCount; i++) {
            if (sortedChunks[i].chunkIndex !== i) {
                throw new Error(`Missing chunk with index ${i}`);
            }
        }
        const decryptedChunks = [];
        for (const chunk of sortedChunks) {
            try {
                const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: chunk.iv }, key, chunk.encryptedData);
                decryptedChunks.push(new Uint8Array(decryptedData));
            }
            catch (error) {
                throw new Error(`Failed to decrypt chunk ${chunk.chunkIndex}: ${error}`);
            }
        }
        const totalLength = decryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of decryptedChunks) {
            result.set(chunk, offset);
            offset += chunk.length;
            SecurityUtils.clearSensitiveData(chunk);
        }
        return result;
    }
}
class ParallelStreamingEncryptor {
    key;
    buffer;
    chunkIndex;
    chunkSize;
    constructor(key) {
        this.key = key;
        this.buffer = new Uint8Array(0);
        this.chunkIndex = 0;
        this.chunkSize = SecurityUtils.CHUNK_SIZE;
    }
    async processChunk(chunk, isLastChunk = false) {
        const newBuffer = new Uint8Array(this.buffer.length + chunk.length);
        newBuffer.set(this.buffer);
        newBuffer.set(chunk, this.buffer.length);
        this.buffer = newBuffer;
        if (this.buffer.length >= this.chunkSize ||
            (isLastChunk && this.buffer.length > 0)) {
            const dataToEncrypt = isLastChunk
                ? this.buffer
                : this.buffer.slice(0, this.chunkSize);
            const iv = SecurityUtils.generateIV();
            const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, dataToEncrypt);
            const result = {
                encryptedData,
                iv,
                chunkIndex: this.chunkIndex++,
                isLastChunk: isLastChunk && this.buffer.length <= this.chunkSize,
            };
            if (!isLastChunk) {
                this.buffer = this.buffer.slice(this.chunkSize);
            }
            else {
                this.buffer = new Uint8Array(0);
            }
            SecurityUtils.clearSensitiveData(dataToEncrypt);
            return result;
        }
        return null;
    }
    async finalize() {
        if (this.buffer.length > 0) {
            await this.processChunk(new Uint8Array(0), true);
        }
        return {
            totalChunks: this.chunkIndex,
            chunkSize: this.chunkSize,
        };
    }
}
//# sourceMappingURL=encryption.js.map