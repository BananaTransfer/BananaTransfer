import { KeyManager } from '../key-manager';

describe('KeyManager', () => {
  test('should generate RSA key pair', async () => {
    const keyPair = await KeyManager.generateRSAKeyPair();

    expect(keyPair.publicKey.algorithm.name).toBe('RSA-OAEP');
    expect(keyPair.privateKey.algorithm.name).toBe('RSA-OAEP');
  }, 10000);

  test('should encrypt and decrypt private key', async () => {
    const keyPair = await KeyManager.generateRSAKeyPair();
    const password = 'test-password';

    const encrypted = await KeyManager.encryptPrivateKey(
      keyPair.privateKey,
      password,
    );
    const decrypted = await KeyManager.decryptPrivateKey(encrypted, password);

    expect(decrypted.algorithm.name).toBe('RSA-OAEP');
  }, 10000);
});
