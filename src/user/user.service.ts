import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly envDomain: string;

  constructor(private configService: ConfigService) {
    const envDomain = this.configService.get<string>('DOMAIN');
    if (!envDomain) {
      throw new Error('Default domain is not set in environment variables');
    }
    this.envDomain = envDomain;
  }

  getUserInfo(): { username: string } {
    // TODO: get current user info from db
    return { username: 'test' };
  }

  getUser(username: string): { username: string } {
    // TODO: get local or remote user from db
    const parsedUser: { user: string; domain: string; isLocal: boolean } =
      this.parseUsername(username);
    if (parsedUser.isLocal) {
      return this.getLocalUser();
    } else {
      return this.getRemoteUser();
    }
  }

  getLocalUser(): { username: string } {
    // TODO: get local user from db
    return { username: 'test' };
  }

  getRemoteUser(): { username: string } {
    // TODO: get remote user from db
    return { username: 'test' };
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

  getKnownRecipients(): string[] {
    // TODO: get known recipients of current user from the db
    return ['recipient1', 'recipient2', 'recipient3'];
  }

  createLocalUser(): void {
    // TODO: implement logic to create a local user in the DB
    // used when someone signs up
  }

  createRemoteUser(): void {
    // TODO: implement logic to create a remote user in the DB
    // used when sending/receiving a transfer to/from a remote user
  }

  private parseUsername(username: string): {
    user: string;
    domain: string;
    isLocal: boolean;
  } {
    const regex = /^([^@]+)@([^@]+)$/;
    let user: string;
    let domain: string;

    if (regex.test(username)) {
      [user, domain] = username.split('@');
    } else {
      user = username;
      domain = this.envDomain;
    }

    const isLocal = domain === this.envDomain;

    return { user, domain, isLocal };
  }
}
