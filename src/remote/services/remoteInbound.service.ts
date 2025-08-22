import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TransferService } from '@transfer/services/transfer.service';
import { TransferChunkService } from '@transfer/services/transferChunk.service';
import { RecipientService } from '@user/services/recipient.service';
import { UserService } from '@user/services/user.service';
import { RemoteUserService } from '@user/services/remoteUser.service';

import { TransferStatus } from '@database/entities/enums';
import { RemoteTransferDto } from '@remote/dto/remoteTransfer.dto';
import { TransferInfoDto } from '@remote/dto/transferInfo.dto';
import { ChunkDto } from '@transfer/dto/chunk.dto';

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
    private readonly transferChunkService: TransferChunkService,
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

  public async remoteFetchTransferInfo(
    domain: string,
    transferId: string,
  ): Promise<TransferInfoDto> {
    this.logger.log(
      `Fetching transfer ${transferId} info for domain ${domain}`,
    );
    const transfer = await this.transferService.getTransferOfRemoteDomain(
      transferId,
      domain,
    );
    const chunks = await this.transferChunkService.listChunks(transfer.id);

    return {
      id: transfer.id,
      status: transfer.status,
      chunks,
    };
  }

  public async remoteFetchTransferChunk(
    domain: string,
    transferId: string,
    chunk: number,
  ): Promise<ChunkDto> {
    this.logger.log(
      `Fetching transfer chunk ${transferId}/${chunk} for domain ${domain}`,
    );
    const transfer = await this.transferService.getTransferOfRemoteDomain(
      transferId,
      domain,
    );

    return await this.transferChunkService.fetchChunk(transfer.id, chunk);
  }

  public async remoteTransferRetrieved(
    domain: string,
    transferId: string,
  ): Promise<string> {
    this.logger.log(
      `Setting transfer ${transferId} for domain ${domain} to retrieved`,
    );
    const transfer = await this.transferService.getTransferOfRemoteDomain(
      transferId,
      domain,
    );

    await this.transferService.setTransferStatus(
      transfer,
      TransferStatus.RETRIEVED,
    );

    return `Transfer ${transferId} set to retrieved`;
  }
}
