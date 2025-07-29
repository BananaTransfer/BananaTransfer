import { FileEncryption } from './encryption';

describe('FileEncryption', () => {
  test('should encrypt and decrypt data', async () => {
    const key = await FileEncryption.generateAESKey();
    const originalData = new TextEncoder().encode('test data');

    const encrypted = await FileEncryption.encryptData(
      originalData.buffer,
      key,
    );
    const decrypted = await FileEncryption.decryptData(encrypted, key);

    const decryptedText = new TextDecoder().decode(decrypted);
    expect(decryptedText).toBe('test data');
  });

  test('should encrypt and decrypt files', async () => {
    const key = await FileEncryption.generateAESKey();
    const originalFile = new File(['test content'], 'test.txt', {
      type: 'text/plain',
    });

    const encrypted = await FileEncryption.encryptFile(originalFile, key);
    const decrypted = await FileEncryption.decryptFile(
      encrypted,
      key,
      'test.txt',
      'text/plain',
    );

    const decryptedText = await decrypted.text();
    expect(decryptedText).toBe('test content');
    expect(decrypted.name).toBe('test.txt');
  });
});
