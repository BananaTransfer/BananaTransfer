import {
  Injectable,
  Inject,
  forwardRef,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthService } from '@auth/services/auth.service';
import { UserStatus } from '@database/entities/enums';
import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

@Injectable()
export class UserService {
  private readonly envDomain: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(LocalUser)
    private localUserRepository: Repository<LocalUser>,
    @InjectRepository(RemoteUser)
    private remoteUserRepository: Repository<RemoteUser>,
    @InjectRepository(TrustedRecipient)
    private trustedRecipientRepository: Repository<TrustedRecipient>,
  ) {
    const envDomain = this.configService.get<string>('DOMAIN');
    if (!envDomain) {
      throw new Error('Domain is not set in environment variables');
    }
    this.envDomain = envDomain;
  }

  getDomain(): string {
    return this.envDomain;
  }

  async findByUserId(userId: number): Promise<LocalUser | null> {
    return await this.localUserRepository.findOneBy({ id: userId });
  }

  async findByUsername(username: string): Promise<LocalUser | null> {
    return await this.localUserRepository.findOneBy({ username });
  }

  async findByEmail(email: string): Promise<LocalUser | null> {
    return await this.localUserRepository.findOneBy({ email });
  }

  async getCurrentUser(userId: number): Promise<LocalUser> {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(
    username: string,
    email: string,
    password_hash: string,
  ): Promise<LocalUser> {
    if (await this.findByUsername(username)) {
      throw new ConflictException('Username already exists');
    }
    if (await this.findByEmail(email)) {
      throw new ConflictException('Email already exists');
    }
    const user = this.localUserRepository.create({
      username,
      email,
      password_hash,
      status: UserStatus.ACTIVE,
    });
    return await this.localUserRepository.save(user);
  }

  async getUserPrivateKey(userId: number): Promise<string> {
    const user = await this.getCurrentUser(userId);
    return user.private_key_encrypted || '';
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

  async changeUserPassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<LocalUser | null> {
    const user = await this.getCurrentUser(userId);
    if (!(await this.authService.validateUserPassword(user, currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.password_hash = await this.authService.hashPassword(newPassword);
    return await this.localUserRepository.save(user);
  }

  async setUserKeys(
    userId: number,
    password: string,
    privateKeyEncrypted: string,
    privateKeyKdf: string,
    publicKey: string,
  ): Promise<LocalUser> {
    const user = await this.getCurrentUser(userId);
    if (!(await this.authService.validateUserPassword(user, password))) {
      throw new UnauthorizedException('Invalid password');
    }
    user.private_key_encrypted = privateKeyEncrypted;
    user.private_key_kdf = privateKeyKdf;
    user.public_key = publicKey;
    return await this.localUserRepository.save(user);
  }

  async getUser(username: string): Promise<User> {
    // TODO: get local or remote user from db
    const parsedUser: { user: string; domain: string; isLocal: boolean } =
      this.parseUsername(username);
    if (parsedUser.isLocal) {
      return await this.getLocalUser(username);
    } else {
      return await this.getRemoteUser(username);
    }
  }

  private async getLocalUser(username: string): Promise<LocalUser> {
    // get local user from db
    const user = await this.localUserRepository.findOneBy({ username });
    if (!user) {
      // this will automatically return a 404 in the controller if user is not found
      throw new NotFoundException('Local user not found');
    }
    return user;
  }

  private async getRemoteUser(username: string): Promise<RemoteUser> {
    // TODO: get remote user from db
    const user = await this.remoteUserRepository.findOneBy({ username });
    if (!user) {
      // this will automatically return a 404 in the controller
      throw new NotFoundException('Remote user not found');
    }
    return user;
  }

  trustPublicKey(/*username: string, recipient: string, publicKey: string*/): void {
    // TODO: implement logic to trust and save the hash of the public key in the DB
    // console.debug(`Trusting public key for user ${username}:`);
    // console.debug(`Recipient: ${recipient}`);
    // console.debug(`Public Key: ${publicKey}`);
  }

  getKnownRecipients(/*userId: number*/): string[] {
    // TODO: get known recipients of current user from the db
    // console.debug(`Fetching known recipients for user ID: ${userId}`);
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
