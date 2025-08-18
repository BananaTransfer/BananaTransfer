import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// import { TransferService } from '@transfer/services/transfer.service';

@Injectable()
export class RemoteInboundService {
  private readonly envDomain: string;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    // private readonly transferService: TransferService,
  ) {
    this.logger = new Logger(RemoteInboundService.name);
    this.envDomain = this.configService.getOrThrow<string>('DOMAIN');
  }

  // remote transfer handling methods
  remoteNewTransfer(domain: string, transferData: any): string {
    // TODO: implement logic to handle a new remote transfer notification
    // check if recipient does exist, send back a NotFoundException if not
    // create sender if it doesn't exist
    // create transfer in database with the status "SENT"
    // notify user about new transfer
    return `New transfer notification received by ${domain}: ${JSON.stringify(transferData)}`;
  }

  remoteFetchTransfer(domain: string, transferId: string): string {
    // TODO: implement logic to fetch transfer data by ID
    // check if transfer exists, send back a NotFoundException if not
    // return transfer data
    // set the transfer status to retrieved
    // const transfer = this.transferService.getTransfer(transferId);
    // if (transfer.sender)

    // transfer.status = 'RETRIEVED';
    return `Transfer data for ID ${transferId} fetched by ${domain}`;
  }

  remoteRefuseTransfer(domain: string, transferId: string): string {
    // TODO: implement logic to refuse a transfer by ID
    // check if transfer exists, send back a NotFoundException if not
    // update the transfer status to "REFUSED"
    return `Transfer with ID ${transferId} refused by ${domain}`;
  }

  remoteDeleteTransfer(domain: string, transferId: string): string {
    // TODO: implement logic to delete a transfer by ID
    // check if transfer exists, send back a NotFoundException if not
    // check if transfer status is "SENT", send back a BadRequestException if not
    // mark the transfer as DELETED in the database
    return `Transfer with ID ${transferId} deleted by ${domain}`;
  }
}
