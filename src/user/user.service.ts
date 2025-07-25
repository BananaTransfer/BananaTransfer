import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserService {
  getUser(): string {
    // TODO: get current user info from db
    return 'Hello User!';
  }

  getPrivateKey(): string {
    // TODO: get encrypted private key from current user form the db
    return 'Encrypted Private Key';
  }

  setUserKeys(privateKey: string, publicKey: string): void {
    // TODO: update the private and public key of the current user in the db
    // console.log('Private Key:', privateKey);
    // console.log('Public Key:', publicKey);
  }

  getPublicKey(username: string): string {
    // TODO: get public key of user from the db
    // console.log(username);
    const user = undefined; // TODO: fetch user from db
    if (!user) {
      // this will automatically return a 404 in the controller
      throw new NotFoundException('User not found');
    }
    return username;
    // return user.publicKey;
  }

  trustPublicKey(username: string, recipient: string, publicKey: string): void {
    // TODO: implement logic to trust and save the hash of the public key in the DB
    // console.log(`Trusting public key for user ${username}:`);
    // console.log(`Recipient: ${recipient}`);
    // console.log(`Public Key: ${publicKey}`);
  }
}
