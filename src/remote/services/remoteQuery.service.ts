import { Injectable, Logger } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';

import { DnsService } from '@remote/services/dns.service';
import { TransferChunkService } from '@transfer/services/transferChunk.service';

import { RemoteTransferDto } from '@remote/dto/remoteTransfer.dto';
import { Recipient } from '@user/types/recipient.type';
import { PublicKeyDto } from '@user/dto/publicKey.dto';
import { ChunkDto } from '@transfer/dto/chunk.dto';
import { TransferInfoDto } from '@remote/dto/transferInfo.dto';

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
    private readonly transferChunkService: TransferChunkService,
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
      `remote/publickey/${recipient.username}`,
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
    try {
      // fetch chunk information of transfer from remote server
      const data = await this.callRemoteApi<void, TransferInfoDto>(
        'GET',
        sender.domain,
        `remote/fetch/transfer/${transfer.id}`,
      );
      const transferInfo = plainToInstance(TransferInfoDto, data);
      await validateOrReject(transferInfo);

      let fetchedSize: number = 0;
      // loop to fetch and save chunks
      for (const chunkId of transferInfo.chunks) {
        const data = await this.callRemoteApi<void, ChunkDto>(
          'GET',
          sender.domain,
          `remote/fetch/transfer/${transfer.id}/${chunkId}`,
        );
        const chunkData = plainToInstance(ChunkDto, data);
        await validateOrReject(chunkData);

        const chunkSize = await this.transferChunkService.saveChunk(
          transfer.id,
          chunkData,
        );

        // check if the fetched size exceeds the originally indicated transfer size
        fetchedSize += chunkSize;
        if (fetchedSize > Number(transfer.size)) {
          throw new Error(
            `Fetched size ${fetchedSize} exceeds originally indicated transfer size ${transfer.size}`,
          );
        }
      }

      // inform remote server that transfer has been retrieved
      await this.callRemoteApi<void, void>(
        'POST',
        sender.domain,
        `remote/transfer/retrieved/${transfer.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error fetching remote transfer ${transfer.id}: ${
          (error as Error).message
        }`,
      );
      // delete the already fetched chunks
      await this.transferChunkService.deleteTransferChunks(transfer.id);
      // TODO: log the error in the transfer-logs
      // TODO: return an error response
    }
  }
}
