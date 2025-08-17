import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserService } from '@user/services/user.service';
import { RemoteUserService } from '@user/services/remoteUser.service';
import { HashKeyService } from './hashKey.service';
import { RemoteService } from '@remote/services/remote.service';

import { GetPubKeyDto } from '@user/dto/getPubKey.dto';
import { Recipient } from '@user/types/recipient.type';
import { MalformedRecipientException } from '@user/types/malformed-recipient-exception.type';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

@Injectable()
export class RecipientService {
  private readonly envDomain: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly remoteUserService: RemoteUserService,
    private readonly hashKeyService: HashKeyService,
    private readonly remoteService: RemoteService,
    @InjectRepository(TrustedRecipient)
    private trustedRecipientRepository: Repository<TrustedRecipient>,
  ) {
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
    currentUser: LocalUser,
    recipientUser: User,
  ): Promise<boolean> {
    const trustedRecipient = await this.trustedRecipientRepository.findOne({
      where: { localUser: currentUser, user: recipientUser },
    });
    return !!trustedRecipient;
  }

  private async isTrustedRecipientKey(
    currentUser: LocalUser,
    recipientUser: User,
    publicKeyHash: string,
  ): Promise<boolean> {
    const trustedRecipient = await this.trustedRecipientRepository.findOne({
      where: {
        localUser: currentUser,
        user: recipientUser,
        public_key_hash: publicKeyHash,
      },
    });
    return !!trustedRecipient;
  }

  public async getPublicKey(
    currentUser: LocalUser,
    recipient: string,
  ): Promise<GetPubKeyDto> {
    const parsedRecipient = this.parseRecipient(recipient);
    const recipientUser = await this.getRecipientUser(parsedRecipient);

    const publicKey = parsedRecipient.isLocal
      ? (await this.userService.getLocalUser(parsedRecipient.username))
          .public_key
      : (await this.remoteService.getRemoteUserPublicKey(parsedRecipient))
          .publicKey;
    const publicKeyHash = this.hashKeyService.hashKey({ publicKey });

    const isKnownRecipient = await this.isKnownRecipient(
      currentUser,
      recipientUser,
    );
    const isTrustedRecipientKey = isKnownRecipient
      ? await this.isTrustedRecipientKey(
          currentUser,
          recipientUser,
          publicKeyHash,
        )
      : false;

    return {
      publicKey,
      publicKeyHash,
      isKnownRecipient,
      isTrustedRecipientKey,
    };
  }

  public async getUser(recipient: string): Promise<User> {
    const parsedRecipient = this.parseRecipient(recipient);
    return await this.getRecipientUser(parsedRecipient);
  }

  private async getRecipientUser(recipient: Recipient): Promise<User> {
    if (recipient.isLocal) {
      return await this.userService.getLocalUser(recipient.username);
    } else {
      return await this.remoteUserService.getRemoteUser(
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

  public async getKnownRecipients(currentUser: LocalUser): Promise<string[]> {
    const trustedRecipients = await this.trustedRecipientRepository.find({
      where: { localUser: currentUser },
    });

    const knownRecipientAddresses = trustedRecipients.map((recipient) => {
      const user = recipient.user;
      // If user has a 'domain' property, it's a RemoteUser; otherwise, it's LocalUser
      const domain =
        'domain' in user && typeof user.domain === 'string'
          ? user.domain
          : this.envDomain;
      return `${user.username}@${domain}`;
    });

    return knownRecipientAddresses;
  }
}
