import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TransferService } from '@transfer/services/transfer.service';

@Injectable()
export class RemoteInboundService {
  private readonly envDomain: string;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly transferService: TransferService,
  ) {
    this.logger = new Logger(RemoteInboundService.name);
    this.envDomain = this.configService.getOrThrow<string>('DOMAIN');
  }

  // remote transfer handling methods
  remoteNewTransfer(domain: string, transferData: any): string {
    // TODO: implement logic to handle a new remote transfer notification
    // check if sender domain is correct
    // check if sender exist as remote user, if not create it
    // check if recipient does exist, send back a NotFoundException if not
    // create sender if it doesn't exist
    // create transfer in database with the status "SENT"
    // notify user about new transfer
    return `New transfer notification received by ${domain}: ${JSON.stringify(transferData)}`;
  }

  remoteFetchTransfer(domain: string, transferId: string): string {
    // TODO: update the transfer status
    this.logger.log(`Fetching transfer ${transferId} for domain ${domain}`);
    const transfer = this.transferService.getTransferOfSenderDomain(
      transferId,
      domain,
    );
    console.log(transfer);
    return `Transfer data for ID ${transferId} fetched by ${domain}`;
  }

  remoteRefuseTransfer(domain: string, transferId: string): string {
    // TODO: implement logic to refuse a transfer by ID
    this.logger.log(`Refusing transfer ${transferId} for domain ${domain}`);
    const transfer = this.transferService.getTransferOfSenderDomain(
      transferId,
      domain,
    );
    console.log(transfer);
    // update the transfer status to "REFUSED"
    return `Transfer with ID ${transferId} refused by ${domain}`;
  }

  remoteDeleteTransfer(domain: string, transferId: string): string {
    // TODO: implement logic to delete a transfer by ID
    this.logger.log(`Deleting transfer ${transferId} for domain ${domain}`);
    const transfer = this.transferService.getTransferOfSenderDomain(
      transferId,
      domain,
    );
    console.log(transfer);
    // check if transfer status is "SENT", send back a BadRequestException if not
    // mark the transfer as DELETED in the database
    return `Transfer with ID ${transferId} deleted by ${domain}`;
  }
}
