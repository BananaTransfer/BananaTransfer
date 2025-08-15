import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RemoteService } from '@remote/services/remote.service';
import { UserService } from '@user/services/user.service';
import { RemoteUserService } from '@user/services/remoteUser.service';
import { GetPubKeyDto } from '@user/dto/getPubKey.dto';
import { Recipient } from '@user/types/recipient.type';
import { MalformedRecipientException } from '@user/types/malformed-recipient-exception.type';
import { User } from '@database/entities/user.entity';

@Injectable()
export class RecipientService {
  private readonly envDomain: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly remoteService: RemoteService,
    private readonly userService: UserService,
    private readonly remoteUserService: RemoteUserService,
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

  async getPublicKey(recipient: string): Promise<GetPubKeyDto> {
    const parsedRecipient = this.parseRecipient(recipient);

    if (parsedRecipient.isLocal) {
      const localUser = await this.userService.getLocalUser(
        parsedRecipient.username,
      );
      return {
        publicKey: localUser.public_key,
        isTrustedRecipient: true, // local user are trusted by default
      };
    } else {
      const remoteUserPublicKey =
        await this.remoteService.getRemoteUserPublicKey(parsedRecipient);
      // get trusted local
      // hash public key
      // compare with trusted local

      return {
        publicKey: remoteUserPublicKey.publicKey,
        isTrustedRecipient: false,
      };
    }
  }

  async getUser(recipient: string): Promise<User> {
    const parsed = this.parseRecipient(recipient);

    if (parsed.isLocal) {
      return await this.userService.getLocalUser(parsed.username);
    } else {
      return await this.remoteUserService.getRemoteUser(
        parsed.username,
        parsed.username,
      );
    }
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
}
