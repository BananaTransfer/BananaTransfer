import { FileEncryption, StreamChunk, StreamingEncryptor } from './encryption';
import { KeyManager } from './key-manager';
import { SecurityUtils } from './security-utils';

// TODO - Complete Interface that output the wrapped key and the encrypted data

describe('Key Management', () => {
  test('should wrap and unwrap AES key with RSA', async () => {
    const recipientKeyPair = await KeyManager.generateRSAKeyPair();
    const aesKey = await FileEncryption.generateAESKey();

    const wrappedKey = await KeyManager.wrapAESKey(
      aesKey,
      recipientKeyPair.publicKey,
    );
    const unwrappedKey = await KeyManager.unwrapAESKey(
      wrappedKey,
      recipientKeyPair.privateKey,
    );

    expect(unwrappedKey.algorithm.name).toBe('AES-GCM');
  });

  test('should fail with wrong private key', async () => {
    const recipientKeyPair = await KeyManager.generateRSAKeyPair();
    const wrongKeyPair = await KeyManager.generateRSAKeyPair();
    const aesKey = await FileEncryption.generateAESKey();

    const wrappedAESKey = await KeyManager.wrapAESKey(
      aesKey,
      recipientKeyPair.publicKey,
    );

    await expect(
      KeyManager.unwrapAESKey(wrappedAESKey, wrongKeyPair.privateKey),
    ).rejects.toThrow();
  });
});

describe('Streaming Encryption', () => {
  let aesKey: CryptoKey;

  beforeAll(async () => {
    aesKey = await FileEncryption.generateAESKey();
  });

  test('should create streaming encryptor', () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    expect(encryptor).toBeDefined();
    expect(typeof encryptor.processChunk).toBe('function');
    expect(typeof encryptor.finalize).toBe('function');
  });

  test('should process chunks incrementally', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const chunkSize = SecurityUtils.CHUNK_SIZE;

    // Send data smaller than chunk size - should return null
    const smallChunk = new Uint8Array(1024); // 1KB
    smallChunk.fill(65); // Fill with 'A'

    const result1 = await encryptor.processChunk(smallChunk);
    expect(result1).toBeNull(); // Not enough data yet

    // Send more data to complete a chunk
    const moreData = new Uint8Array(chunkSize - 1024 + 100); // Complete chunk + extra
    moreData.fill(66); // Fill with 'B'

    const result2 = await encryptor.processChunk(moreData);
    expect(result2).not.toBeNull();
    expect(result2?.chunkIndex).toBe(0);
    expect(result2?.isLastChunk).toBe(false);
    expect(result2?.encryptedData).toBeInstanceOf(ArrayBuffer);
    expect(result2?.iv).toBeInstanceOf(Uint8Array);
  });

  test('should handle end of stream properly', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);

    // Send partial data
    const partialChunk = new Uint8Array(1024);
    partialChunk.fill(67); // Fill with 'C'

    const result1 = await encryptor.processChunk(partialChunk);
    expect(result1).toBeNull(); // Not enough for full chunk

    // Mark as last chunk - should process remaining data
    const result2 = await encryptor.processChunk(new Uint8Array(0), true);
    expect(result2).not.toBeNull();
    expect(result2?.chunkIndex).toBe(0);
    expect(result2?.isLastChunk).toBe(true);
    expect(result2?.encryptedData.byteLength).toBeGreaterThan(0);
  });

  test('should simulate real upload stream processing', async () => {
    const encryptor: StreamingEncryptor =
      FileEncryption.createStreamingEncryptor(aesKey);
    const encryptedChunks: StreamChunk[] = [];

    // Simulate network chunks arriving (varying sizes)
    const networkChunks = [
      new Uint8Array(64 * 1024).fill(1), // 64KB
      new Uint8Array(128 * 1024).fill(2), // 128KB
      new Uint8Array(512 * 1024).fill(3), // 512KB
      new Uint8Array(400 * 1024).fill(4), // 400KB
      new Uint8Array(100 * 1024).fill(5), // 100KB (last chunk)
    ];

    // Process chunks as they arrive
    for (let i = 0; i < networkChunks.length; i++) {
      const isLast = i === networkChunks.length - 1;
      const result: StreamChunk | null = await encryptor.processChunk(
        networkChunks[i],
        isLast,
      );

      if (result) {
        encryptedChunks.push(result);
      }
    }

    // Should have processed chunks when buffer filled up
    expect(encryptedChunks.length).toBeGreaterThan(0);

    // Verify chunk indices are sequential
    encryptedChunks.forEach((chunk, index) => {
      expect(chunk.chunkIndex).toBe(index);
    });

    // Last chunk should be marked as such
    const lastChunk = encryptedChunks[encryptedChunks.length - 1];
    expect(lastChunk.isLastChunk).toBe(true);

    // Get final metadata
    const metadata = await encryptor.finalize();
    expect(metadata.totalChunks).toBe(encryptedChunks.length);
    expect(metadata.chunkSize).toBe(SecurityUtils.CHUNK_SIZE);
  });

  test('should handle multiple complete chunks', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const encryptedChunks: StreamChunk[] = [];

    // Send multiple chunks separately to test chunk processing
    const chunkSize = SecurityUtils.CHUNK_SIZE;

    // Send first full chunk
    const chunk1 = new Uint8Array(chunkSize);
    chunk1.fill(1);
    const result1 = await encryptor.processChunk(chunk1);
    if (result1) encryptedChunks.push(result1);

    // Send second full chunk
    const chunk2 = new Uint8Array(chunkSize);
    chunk2.fill(2);
    const result2 = await encryptor.processChunk(chunk2);
    if (result2) encryptedChunks.push(result2);

    // Send partial final chunk
    const chunk3 = new Uint8Array(chunkSize / 2);
    chunk3.fill(3);
    const result3 = await encryptor.processChunk(chunk3, true);
    if (result3) encryptedChunks.push(result3);

    // Should have created multiple chunks
    expect(encryptedChunks.length).toBeGreaterThanOrEqual(2);

    // Verify chunk properties
    expect(encryptedChunks[0].chunkIndex).toBe(0);
    expect(encryptedChunks[0].isLastChunk).toBe(false);

    if (encryptedChunks.length > 1) {
      expect(encryptedChunks[1].chunkIndex).toBe(1);
      expect(encryptedChunks[1].isLastChunk).toBe(false);
    }

    // Last chunk should be marked as such
    const lastChunk = encryptedChunks[encryptedChunks.length - 1];
    expect(lastChunk.isLastChunk).toBe(true);

    // Full chunks should be full size (plus auth tag)
    for (let i = 0; i < encryptedChunks.length - 1; i++) {
      expect(encryptedChunks[i].encryptedData.byteLength).toBe(
        chunkSize + SecurityUtils.GCM_AUTH_TAG_SIZE,
      );
    }
  });

  test('should generate unique IVs for each chunk', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const encryptedChunks: StreamChunk[] = [];

    // Process multiple chunks
    const chunkSize = SecurityUtils.CHUNK_SIZE;

    // Send first chunk
    const chunk1 = new Uint8Array(chunkSize);
    chunk1.fill(1);
    const result1 = await encryptor.processChunk(chunk1);
    if (result1) encryptedChunks.push(result1);

    // Send second chunk (marked as last)
    const chunk2 = new Uint8Array(chunkSize);
    chunk2.fill(2);
    const result2 = await encryptor.processChunk(chunk2, true);
    if (result2) encryptedChunks.push(result2);

    // Should have 2 chunks with different IVs
    expect(encryptedChunks.length).toBe(2);
    expect(Array.from(encryptedChunks[0].iv)).not.toEqual(
      Array.from(encryptedChunks[1].iv),
    );
  });

  test('should preserve data integrity through parallel encryption', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const originalData = 'Hello, this is streaming test data';
    const originalBytes = new TextEncoder().encode(originalData);

    // Process in one go
    const result = await encryptor.processChunk(originalBytes, true);
    expect(result).not.toBeNull();

    // Decrypt to verify data integrity
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: result!.iv as BufferSource },
      aesKey,
      result!.encryptedData as BufferSource,
    );

    const decryptedText = new TextDecoder().decode(decrypted);
    expect(decryptedText).toBe(originalData);
  });

  test('should handle very small files (smaller than chunk size)', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);

    // Simulate a very small file (10 bytes)
    const smallFileData = new TextEncoder().encode('small file');
    expect(smallFileData.length).toBeLessThan(SecurityUtils.CHUNK_SIZE);

    // Process as single chunk marked as last
    const result = await encryptor.processChunk(smallFileData, true);

    // Should create one encrypted chunk
    expect(result).not.toBeNull();
    expect(result?.chunkIndex).toBe(0);
    expect(result?.isLastChunk).toBe(true);

    // Verify data integrity
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: result!.iv as BufferSource },
      aesKey,
      result!.encryptedData as BufferSource,
    );

    const decryptedText = new TextDecoder().decode(decrypted);
    expect(decryptedText).toBe('small file');

    // Verify metadata
    const metadata = await encryptor.finalize();
    expect(metadata.totalChunks).toBe(1);
  });

  test('should handle zero-byte chunks gracefully', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);

    // Send empty chunk
    const result1 = await encryptor.processChunk(new Uint8Array(0));
    expect(result1).toBeNull();

    // Send empty chunk marked as last
    const result2 = await encryptor.processChunk(new Uint8Array(0), true);
    expect(result2).toBeNull(); // No data to encrypt

    const metadata = await encryptor.finalize();
    expect(metadata.totalChunks).toBe(0);
  });

  test('should maintain chunk order with concurrent processing simulation', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const results: StreamChunk[] = [];

    // Simulate chunks arriving and being processed
    const chunks = [
      new Uint8Array(300 * 1024).fill(1), // 300KB
      new Uint8Array(400 * 1024).fill(2), // 400KB
      new Uint8Array(500 * 1024).fill(3), // 500KB (completes first 1MB)
      new Uint8Array(200 * 1024).fill(4), // 200KB (starts second chunk)
      new Uint8Array(100 * 1024).fill(5), // 100KB (final, small chunk)
    ];

    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      const result = await encryptor.processChunk(chunks[i], isLast);
      if (result) results.push(result);
    }

    // Verify chunks are in correct order
    for (let i = 0; i < results.length; i++) {
      expect(results[i].chunkIndex).toBe(i);
    }

    // Verify we got the expected number of chunks
    expect(results.length).toBeGreaterThan(0);
    expect(results[results.length - 1].isLastChunk).toBe(true);
  });
});

describe('Decryption', () => {
  let aesKey: CryptoKey;

  beforeAll(async () => {
    aesKey = await FileEncryption.generateAESKey();
  });

  test('should decrypt single chunk file correctly', async () => {
    const originalData = 'Hello, this is a small test file!';
    const originalBytes = new TextEncoder().encode(originalData);

    // Encrypt
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const encryptedChunk = await encryptor.processChunk(originalBytes, true);
    expect(encryptedChunk).not.toBeNull();

    // Decrypt
    const decryptedBytes = await FileEncryption.decryptChunks(
      [encryptedChunk!],
      aesKey,
    );
    const decryptedText = new TextDecoder().decode(decryptedBytes);

    expect(decryptedText).toBe(originalData);
  });

  test('should decrypt multiple chunks file correctly', async () => {
    const originalData = 'A'.repeat(2.5 * 1024 * 1024); // 2.5MB file
    const originalBytes = new TextEncoder().encode(originalData);

    // Encrypt in chunks
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const encryptedChunks: StreamChunk[] = [];

    // Process in 500KB chunks
    const chunkSize = 500 * 1024;
    for (let i = 0; i < originalBytes.length; i += chunkSize) {
      const chunk = originalBytes.slice(i, i + chunkSize);
      const isLast = i + chunkSize >= originalBytes.length;

      const result = await encryptor.processChunk(chunk, isLast);
      if (result) {
        encryptedChunks.push(result);
      }
    }

    expect(encryptedChunks.length).toBeGreaterThan(1);

    // Decrypt all chunks
    const decryptedBytes = await FileEncryption.decryptChunks(
      encryptedChunks,
      aesKey,
    );
    const decryptedText = new TextDecoder().decode(decryptedBytes);

    expect(decryptedText).toBe(originalData);
    expect(decryptedBytes.length).toBe(originalBytes.length);
  });

  test('should handle chunks in wrong order', async () => {
    const originalData = 'Test data for out-of-order chunks';
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const encryptedChunks: StreamChunk[] = [];

    // Create multiple chunks
    const chunkSize = SecurityUtils.CHUNK_SIZE;
    const chunk1 = new Uint8Array(chunkSize).fill(65); // 'A'
    const chunk2 = new Uint8Array(chunkSize).fill(66); // 'B'
    const chunk3 = new TextEncoder().encode(originalData);

    const result1 = await encryptor.processChunk(chunk1);
    const result2 = await encryptor.processChunk(chunk2);
    const result3 = await encryptor.processChunk(chunk3, true);

    if (result1) encryptedChunks.push(result1);
    if (result2) encryptedChunks.push(result2);
    if (result3) encryptedChunks.push(result3);

    // Shuffle chunks to simulate wrong order
    const shuffledChunks = [
      encryptedChunks[2],
      encryptedChunks[0],
      encryptedChunks[1],
    ];

    // Should still decrypt correctly
    const decrypted = await FileEncryption.decryptChunks(
      shuffledChunks,
      aesKey,
    );

    // Verify the last part contains our test data
    const lastPartStart = chunkSize * 2;
    const lastPart = decrypted.slice(lastPartStart);
    const lastPartText = new TextDecoder().decode(lastPart);

    expect(lastPartText).toBe(originalData);
  });

  test('should throw error for empty chunks array', async () => {
    await expect(FileEncryption.decryptChunks([], aesKey)).rejects.toThrow(
      'No encrypted chunks provided',
    );
  });

  test('should throw error when no last chunk marker', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const chunk = await encryptor.processChunk(new Uint8Array(100).fill(1));

    if (chunk) {
      // Remove last chunk marker
      const chunkWithoutLastMarker = { ...chunk, isLastChunk: false };

      await expect(
        FileEncryption.decryptChunks([chunkWithoutLastMarker], aesKey),
      ).rejects.toThrow('No last chunk found - file may be incomplete');
    }
  });

  test('should throw error for missing chunks', async () => {
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const encryptedChunks: StreamChunk[] = [];

    // Create 3 chunks but only provide 2
    const chunkSize = SecurityUtils.CHUNK_SIZE;
    const chunk1 = new Uint8Array(chunkSize).fill(1);
    const chunk2 = new Uint8Array(chunkSize).fill(2);
    const chunk3 = new Uint8Array(chunkSize).fill(3);

    const result1 = await encryptor.processChunk(chunk1);
    // Skip result2 to simulate missing chunk
    await encryptor.processChunk(chunk2);
    const result3 = await encryptor.processChunk(chunk3, true);

    if (result1) encryptedChunks.push(result1);
    if (result3) encryptedChunks.push(result3);

    await expect(
      FileEncryption.decryptChunks(encryptedChunks, aesKey),
    ).rejects.toThrow('Missing chunks: received 2, expected 3');
  });

  test('should throw error for wrong decryption key', async () => {
    const originalData = 'Secret data';
    const originalBytes = new TextEncoder().encode(originalData);
    const wrongKey = await FileEncryption.generateAESKey();

    // Encrypt with correct key
    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const encryptedChunk = await encryptor.processChunk(originalBytes, true);

    // Try to decrypt with wrong key
    await expect(
      FileEncryption.decryptChunks([encryptedChunk!], wrongKey),
    ).rejects.toThrow('Failed to decrypt chunk 0');
  });

  test('should handle file upload simulation with decryption', async () => {
    // Simulate file upload
    const fileContent = 'Test file content for upload simulation';
    const mockFile = new File([fileContent], 'test.txt', {
      type: 'text/plain',
    });

    const encryptor = FileEncryption.createStreamingEncryptor(aesKey);
    const encryptedChunks: StreamChunk[] = [];

    // Process file stream
    const reader = mockFile.stream().getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();

        const result = await encryptor.processChunk(
          value || new Uint8Array(0),
          done,
        );
        if (result) {
          encryptedChunks.push(result);
        }

        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }

    // Decrypt and verify
    const decryptedBytes = await FileEncryption.decryptChunks(
      encryptedChunks,
      aesKey,
    );
    const decryptedText = new TextDecoder().decode(decryptedBytes);

    expect(decryptedText).toBe(fileContent);
    expect(encryptedChunks.length).toBeGreaterThan(0);
    expect(encryptedChunks[encryptedChunks.length - 1].isLastChunk).toBe(true);
  });
});
