import { Injectable } from '@nestjs/common';
import { GetPubKeyDto } from '@user/dto/getPubKey.dto';
import RecipientParsingService from '@user/services/recipientParsing.service';
import { UserService } from '@user/services/user.service';

@Injectable()
export class RecipientService {
  constructor(
    private readonly recipientParsingService: RecipientParsingService,
    private readonly userService: UserService,
  ) {}

  async getPublicKey(recipient: string): Promise<GetPubKeyDto> {
    const parsed = this.recipientParsingService.parseRecipient(recipient);

    if (parsed.isLocal) {
      const localUser = await this.userService.getLocalUser(parsed.username);

      return {
        publicKey: localUser.public_key,
        isTrustedRecipient: true, // local user are trusted by default
      };
    } else {
      // contact remote service to get key
      // compare with trusted local
      return {
        publicKey: 'TODO',
        isTrustedRecipient: false,
      };
    }
  }
}
