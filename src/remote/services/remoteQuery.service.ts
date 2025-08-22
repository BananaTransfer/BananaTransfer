import { Injectable, Logger } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';

import { DnsService } from '@remote/services/dns.service';

import { RemoteTransferDto } from '@remote/dto/remoteTransfer.dto';
import { Recipient } from '@user/types/recipient.type';
import { PublicKeyDto } from '@user/dto/publicKey.dto';

import { FileTransfer } from '@database/entities/file-transfer.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';

@Injectable()
export class RemoteQueryService {
  private readonly envDomain: string;
  private readonly nodeEnv?: string;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly dnsService: DnsService,
  ) {
    this.logger = new Logger(RemoteQueryService.name);
    this.envDomain = this.configService.getOrThrow<string>('DOMAIN');
    this.nodeEnv = this.configService.get<string>('NODE_ENV');
  }

  private async callRemoteApi<R, T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    domain: string,
    path: string,
    body?: R,
  ): Promise<T> {
    const protocol = this.nodeEnv === 'dev' ? 'http' : 'https';
    const serverAddress = await this.dnsService.getServerAddress(domain);
    const url = `${protocol}://${serverAddress}/${path}`;

    const request = {
      method: method,
      headers: { 'x-bananatransfer-domain': this.envDomain },
    };

    if (body) {
      request['body'] = JSON.stringify({ body });
      request.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, request);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }

  async getRemoteUserPublicKey(recipient: Recipient): Promise<PublicKeyDto> {
    this.logger.debug(
      `Fetching public key for remote user ${recipient.username} on domain ${recipient.domain}`,
    );

    const data = await this.callRemoteApi<PublicKeyDto, PublicKeyDto>(
      'GET',
      recipient.domain,
      `remote/get/publickey/${recipient.username}`,
    );

    const dto = plainToInstance(PublicKeyDto, data);
    await validateOrReject(dto);
    return dto;
  }

  // inform remote server about new transfer
  async newRemoteTransfer(transfer: FileTransfer): Promise<void> {
    const recipient = transfer.receiver as RemoteUser;
    this.logger.debug(
      `Creating new remote transfer ${transfer.id} for recipient ${recipient.username}@${recipient.domain}`,
    );

    const remoteTransfer: RemoteTransferDto = {
      id: transfer.id,
      symmetric_key_encrypted: transfer.symmetric_key_encrypted,
      filename: transfer.filename,
      subject: transfer.subject,
      size: transfer.size.toString(),
      senderAddress: `${transfer.sender.username}@${this.envDomain}`,
      recipientAddress: `${recipient.username}@${recipient.domain}`,
    };

    const response = await this.callRemoteApi<RemoteTransferDto, string>(
      'POST',
      recipient.domain,
      `remote/new/transfer`,
      remoteTransfer,
    );
    this.logger.log(`Answer from Remote ${recipient.domain}: ${response}`);
  }

  // fetch transfer chunks from remote server
  async fetchRemoteTransfer(transfer: FileTransfer): Promise<void> {
    const sender = transfer.sender as RemoteUser;
    this.logger.debug(
      `Fetching remote transfer ${transfer.id} of sender ${sender.username}@${sender.domain}`,
    );
    // TODO: add check when fetching file from remote server that it isn't bigger than indicated
    // TODO: logic to fetch chunks
    await this.callRemoteApi<void, void>(
      'POST',
      this.envDomain,
      `remote/fetch/transfer/${transfer.id}`,
    );
  }

  // inform remote server that recipient has accepted the transfer
  /*async acceptRemoteTransfer(transfer: FileTransfer): Promise<void> {
    const sender = transfer.sender as RemoteUser;
    this.logger.debug(
      `Accepting remote transfer ${transfer.id} of sender ${sender.username}@${sender.domain}`,
    );

    await this.callRemoteApi<void, void>(
      'POST',
      this.envDomain,
      `remote/accept/transfer/${transfer.id}`,
    );
  }

  // inform remote server that recipient has refused the transfer
  async refuseRemoteTransfer(transfer: FileTransfer): Promise<void> {
    const sender = transfer.sender as RemoteUser;
    this.logger.debug(
      `Refusing remote transfer ${transfer.id} of sender ${sender.username}@${sender.domain}`,
    );

    await this.callRemoteApi<void, void>(
      'POST',
      this.envDomain,
      `remote/refuse/transfer/${transfer.id}`,
    );
  }

  // inform remote server about deleted transfer
  async deleteRemoteTransfer(transfer: FileTransfer): Promise<void> {
    this.logger.debug(`Deleting remote transfer ${transfer.id}`);

    await this.callRemoteApi<void, void>(
      'POST',
      this.envDomain,
      `remote/delete/transfer/${transfer.id}`,
    );
  }*/
}
