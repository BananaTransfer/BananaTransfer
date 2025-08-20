import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserService } from '@user/services/user.service';
import { RemoteUserService } from '@user/services/remoteUser.service';
import { HashKeyService } from './hashKey.service';
import { RemoteQueryService } from '@remote/services/remoteQuery.service';

import { GetPubKeyDto } from '@user/dto/getPubKey.dto';
import { Recipient } from '@user/types/recipient.type';
import { MalformedRecipientException } from '@user/types/malformed-recipient-exception.type';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

@Injectable()
export class RecipientService {
  private readonly envDomain: string;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly remoteUserService: RemoteUserService,
    private readonly hashKeyService: HashKeyService,
    private readonly remoteQueryService: RemoteQueryService,
    @InjectRepository(TrustedRecipient)
    private trustedRecipientRepository: Repository<TrustedRecipient>,
  ) {
    this.logger = new Logger(RecipientService.name);
    this.envDomain = this.configService.getOrThrow<string>('DOMAIN');
  }

  public parseRecipient(recipient: string): Recipient {
    const splitRecipient = recipient.split('@');

    if (splitRecipient.length > 2) {
      throw new MalformedRecipientException('Recipient contains multiple @');
    }

    const username = splitRecipient[0];
    let domain = this.envDomain;

    if (splitRecipient.length == 2) {
      domain = splitRecipient[1];
    }

    if (username.length == 0) {
      throw new MalformedRecipientException('Empty username provided');
    }

    if (domain.length == 0) {
      throw new MalformedRecipientException('Empty domain provided');
    }

    const isLocal = domain === this.envDomain;

    return { username, domain, isLocal };
  }

  private async isKnownRecipient(
    userId: number,
    recipientUser: User,
  ): Promise<boolean> {
    const trustedRecipient = await this.trustedRecipientRepository.findOne({
      where: { localUser: { id: userId }, user: { id: recipientUser.id } },
      relations: ['user', 'localUser'],
    });
    return !!trustedRecipient;
  }

  async isTrustedRecipientKey(
    userId: number,
    recipientUser: User,
    publicKeyHash: string,
  ): Promise<boolean> {
    const trustedRecipient = await this.trustedRecipientRepository.findOne({
      where: {
        localUser: { id: userId },
        user: { id: recipientUser.id },
        public_key_hash: publicKeyHash,
      },
      relations: ['user', 'localUser'],
    });
    return !!trustedRecipient;
  }

  public async getPublicKey(
    userId: number,
    recipient: string,
  ): Promise<GetPubKeyDto> {
    const parsedRecipient = this.parseRecipient(recipient);

    const publicKey = parsedRecipient.isLocal
      ? (await this.userService.getLocalUser(parsedRecipient.username))
          .public_key
      : (await this.remoteQueryService.getRemoteUserPublicKey(parsedRecipient))
          .publicKey;
    const publicKeyHash = this.hashKeyService.hashKey({ publicKey });

    const recipientUser = await this.getRecipientUser(parsedRecipient);
    const isKnownRecipient =
      !!recipientUser && (await this.isKnownRecipient(userId, recipientUser));
    const isTrustedRecipientKey =
      isKnownRecipient &&
      (await this.isTrustedRecipientKey(userId, recipientUser, publicKeyHash));

    return {
      publicKey,
      publicKeyHash,
      isKnownRecipient,
      isTrustedRecipientKey,
    };
  }

  public async getUser(recipient: string): Promise<User | null> {
    const parsedRecipient = this.parseRecipient(recipient);
    // returns null if user is remote and doesn't exist
    return await this.getRecipientUser(parsedRecipient);
  }

  private async getRecipientUser(recipient: Recipient): Promise<User | null> {
    if (recipient.isLocal) {
      return await this.userService.getLocalUser(recipient.username);
    } else {
      // returns null if remote user doesn't exist
      return await this.remoteUserService.getRemoteUser(
        recipient.username,
        recipient.domain,
      );
    }
  }

  public async getOrCreateUser(recipient: string): Promise<User> {
    const parsedRecipient = this.parseRecipient(recipient);
    return await this.getOrCreateRecipientUser(parsedRecipient);
  }

  private async getOrCreateRecipientUser(recipient: Recipient): Promise<User> {
    if (recipient.isLocal) {
      return await this.userService.getLocalUser(recipient.username);
    } else {
      return await this.remoteUserService.getOrCreateRemoteUser(
        recipient.username,
        recipient.domain,
      );
    }
  }

  public async addTrustedRecipient(
    currentUser: LocalUser,
    recipientUser: User,
    publicKeyHash: string,
  ): Promise<void> {
    const newTrustedRecipient = this.trustedRecipientRepository.create({
      localUser: currentUser,
      user: recipientUser,
      public_key_hash: publicKeyHash,
    });
    await this.trustedRecipientRepository.save(newTrustedRecipient);
  }

  public async getKnownRecipients(userId: number): Promise<string[]> {
    const trustedRecipients = await this.trustedRecipientRepository.find({
      where: { localUser: { id: userId } },
      relations: ['user', 'localUser'],
    });
    let knownRecipientAddresses = trustedRecipients.map((recipient) =>
      this.getRecipientAddress(recipient.user),
    );
    knownRecipientAddresses = [...new Set(knownRecipientAddresses.sort())];
    return knownRecipientAddresses;
  }

  public getRecipientAddress(recipient: User): string {
    if ('domain' in recipient && typeof recipient.domain === 'string') {
      return `${recipient.username}@${recipient.domain}`;
    }
    return `${recipient.username}@${this.envDomain}`;
  }
}
