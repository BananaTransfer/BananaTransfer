import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TransferService } from '@transfer/services/transfer.service';
import { RecipientService } from '@user/services/recipient.service';
import { UserService } from '@user/services/user.service';
import { RemoteUserService } from '@user/services/remoteUser.service';
import { RemoteTransferDto } from '@remote/dto/remoteTransfer.dto';

@Injectable()
export class RemoteInboundService {
  private readonly envDomain: string;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly recipientService: RecipientService,
    private readonly userService: UserService,
    private readonly remoteUserService: RemoteUserService,
    private readonly transferService: TransferService,
  ) {
    this.logger = new Logger(RemoteInboundService.name);
    this.envDomain = this.configService.getOrThrow<string>('DOMAIN');
  }

  // remote transfer handling methods
  public async remoteNewTransfer(
    domain: string,
    remoteTransfer: RemoteTransferDto,
  ): Promise<string> {
    // check if sender domain matches to the domain of the remote server
    const parsedSender = this.recipientService.parseRecipient(
      remoteTransfer.senderAddress,
    );
    if (parsedSender.isLocal || parsedSender.domain !== domain) {
      throw new Error(
        `Sender domain ${parsedSender.domain} does not match expected domain ${domain}`,
      );
    }
    // check if recipient is local and matches to the local domain
    const parsedRecipient = this.recipientService.parseRecipient(
      remoteTransfer.recipientAddress,
    );
    if (!parsedRecipient.isLocal || parsedRecipient.domain !== this.envDomain) {
      throw new Error(
        `Recipient domain ${parsedRecipient.domain} does not match expected domain ${this.envDomain}`,
      );
    }
    // get local user that is the recipient, throws an error if not found
    const recipientUser = await this.userService.getLocalUser(
      parsedRecipient.username,
    );
    // get or create remote user that is the sender
    const senderUser = await this.remoteUserService.getOrCreateRemoteUser(
      parsedSender.username,
      parsedSender.domain,
    );
    await this.transferService.newTransferFromRemote(
      remoteTransfer,
      recipientUser,
      senderUser,
    );
    return `New transfer ${remoteTransfer.id} created`;
  }

  public async remoteFetchTransfer(
    domain: string,
    transferId: string,
  ): Promise<string> {
    this.logger.log(`Fetching transfer ${transferId} for domain ${domain}`);
    const transfer = await this.transferService.getTransferOfSenderDomain(
      transferId,
      domain,
    );
    // TODO: create logic to fetch transfer data chunks
    console.log(transfer);
    return `Transfer data for ID ${transferId} fetched by ${domain}`;
  }

  /* public async remoteAcceptTransfer(
    domain: string,
    transferId: string,
  ): Promise<string> {
    this.logger.log(`Accepting transfer ${transferId} for domain ${domain}`);
    const transfer = await this.transferService.getTransferOfSenderDomain(
      transferId,
      domain,
    );
    await this.transferService.acceptTransferLocally(transfer);
    return `Transfer ${transfer.id} accepted`;
  }

  public async remoteRefuseTransfer(
    domain: string,
    transferId: string,
  ): Promise<string> {
    this.logger.log(`Refusing transfer ${transferId} for domain ${domain}`);
    const transfer = await this.transferService.getTransferOfSenderDomain(
      transferId,
      domain,
    );
    await this.transferService.refuseTransferLocally(transfer);
    return `Transfer ${transfer.id} refused`;
  }

  public async remoteDeleteTransfer(
    domain: string,
    transferId: string,
  ): Promise<string> {
    this.logger.log(`Deleting transfer ${transferId} for domain ${domain}`);
    const transfer = await this.transferService.getTransferOfSenderDomain(
      transferId,
      domain,
    );
    await this.transferService.deleteTransferLocally(transfer);
    return `Transfer ${transfer.id} deleted`;
  }*/
}
