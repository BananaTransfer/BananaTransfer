import { Injectable, Logger } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { ConfigService } from '@nestjs/config';

import { DnsService } from '@remote/services/dns.service';
import { Recipient } from '@user/types/recipient.type';
import { PublicKeyDto } from '@user/dto/publicKey.dto';

@Injectable()
export class RemoteService {
  private readonly envDomain: string;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly dnsService: DnsService,
  ) {
    this.logger = new Logger(RemoteService.name);
    this.envDomain = this.configService.getOrThrow<string>('DOMAIN');
  }

  async getRemoteUserPublicKey(recipient: Recipient): Promise<PublicKeyDto> {
    const serverAddress = await this.dnsService.getServerAddress(
      recipient.domain,
    );
    const url = `http://${serverAddress}/remote/get/publickey/${recipient.username}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-bananatransfer-domain': this.envDomain,
      },
    });

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const data = (await res.json()) as PublicKeyDto;
    await validateOrReject(data);

    return data;
  }

  // remote transfer handling methods
  remoteNewTransfer(transferData: any): string {
    // TODO: implement logic to handle a new remote transfer notification
    // check if recipient does exist, send back a NotFoundException if not
    // create sender if it doesn't exist
    // create transfer in database with the status "SENT"
    // notify user about new transfer
    return `New transfer notification received: ${JSON.stringify(transferData)}`;
  }

  remoteFetchTransfer(id: string): string {
    // TODO: implement logic to fetch transfer data by ID
    // check if transfer exists, send back a NotFoundException if not
    // return transfer data
    // set the transfer status to retrieved
    return `Transfer data for ID ${id}`;
  }

  remoteRefuseTransfer(id: string): string {
    // TODO: implement logic to refuse a transfer by ID
    // check if transfer exists, send back a NotFoundException if not
    // update the transfer status to "REFUSED"
    return `Transfer with ID ${id} refused`;
  }

  remoteDeleteTransfer(id: string): string {
    // TODO: implement logic to delete a transfer by ID
    // check if transfer exists, send back a NotFoundException if not
    // check if transfer status is "SENT", send back a BadRequestException if not
    // mark the transfer as DELETED in the database
    return `Transfer with ID ${id} deleted`;
  }
}
