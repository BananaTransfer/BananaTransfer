import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client';

import { TransferStatus, LogInfo } from '@database/entities/enums';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

@Injectable()
export class TransferService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(FileTransfer)
    private fileTransferRepository: Repository<FileTransfer>,
    @InjectRepository(TransferLog)
    private transferLogRepository: Repository<TransferLog>,
  ) {
    const isLocal = !!this.configService.get<string>('S3_ENDPOINT');
    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION'),
      ...(isLocal && {
        endpoint: this.configService.get<string>('S3_ENDPOINT'),
        forcePathStyle: true,
        credentials: {
          accessKeyId: this.configService.get<string>('S3_CLIENT_ID'),
          secretAccessKey: this.configService.get<string>('S3_CLIENT_SECRET'),
        },
      }),
    } as S3ClientConfig);

    this.bucket = this.configService.get<string>('S3_BUCKET') as string;
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.s3Client.send(new ListBucketsCommand({}));
      return !!result.Buckets;
    } catch (error) {
      console.error('S3 connection error:', error);
      return false;
    }
  }

  // local transfer handling methods
  async getTransferList(userId: number): Promise<FileTransfer[]> {
    // TODO: implement logic to fetch list of all incoming and outgoing transfers of a user
    return this.fileTransferRepository.find({
      where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
      relations: ['sender', 'receiver'],
    });
  }

  async getTransferDetails(
    transferId: number,
    userId: number,
  ): Promise<[FileTransfer, TransferLog[]]> {
    // TODO: Get transfer details including logs
    const transfer = await this.fileTransferRepository.findOne({
      where: [
        { id: transferId, sender: { id: userId } },
        { id: transferId, receiver: { id: userId } },
      ],
      relations: ['sender', 'receiver'],
    });
    if (!transfer) {
      throw new NotFoundException(`Transfer with ID ${transferId} not found`);
    }
    const logs = await this.transferLogRepository.find({
      where: { fileTransfer: { id: transferId } },
    });
    return [transfer, logs];
  }

  fetchTransfer(id: number, userId: number): string {
    // TODO: implement logic to fetch transfer content by ID
    return `Transfer data for ID ${id} and user ID ${userId}`;
  }

  newTransfer(transferData: any): string {
    // TODO: implement logic to create a new transfer
    return 'New transfer created with data: ' + JSON.stringify(transferData);
  }

  acceptTransfer(id: number): string {
    // TODO: implement logic to accept a transfer by ID
    return `Transfer with ID ${id} accepted`;
  }

  refuseTransfer(id: number): string {
    // TODO: implement logic to refuse a transfer by ID
    return `Transfer with ID ${id} refused`;
  }

  deleteTransfer(id: number): string {
    // TODO: implement logic to delete a transfer by ID
    return `Transfer with ID ${id} deleted`;
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

  remoteFetchTransfer(id: number): string {
    // TODO: implement logic to fetch transfer data by ID
    // check if transfer exists, send back a NotFoundException if not
    // return transfer data
    // set the transfer status to retrieved
    return `Transfer data for ID ${id}`;
  }

  remoteRefuseTransfer(id: number): string {
    // TODO: implement logic to refuse a transfer by ID
    // check if transfer exists, send back a NotFoundException if not
    // update the transfer status to "REFUSED"
    return `Transfer with ID ${id} refused`;
  }

  remoteDeleteTransfer(id: number): string {
    // TODO: implement logic to delete a transfer by ID
    // check if transfer exists, send back a NotFoundException if not
    // check if transfer status is "SENT", send back a BadRequestException if not
    // mark the transfer as DELETED in the database
    return `Transfer with ID ${id} deleted`;
  }
}
