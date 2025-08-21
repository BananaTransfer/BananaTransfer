import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';

import { LogInfo, TransferStatus } from '@database/entities/enums';
import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';
import { BucketService } from '@transfer/services/bucket.service';
import { TransferDto } from '@transfer/dto/transfer.dto';
import { CreateTransferDto } from '@transfer/dto/create-transfer.dto';
import { UserService } from '@user/services/user.service';
import { ChunkDto } from '@transfer/dto/chunk.dto';
import * as fs from 'node:fs/promises';
import { RecipientService } from '@user/services/recipient.service';
import { RemoteTransferDto } from '@remote/dto/remoteTransfer.dto';

interface BucketChunkData {
  data: string;
  iv: string;
}

const STATUS_DELETABLE_BY_SENDER_LOCALY = [
  TransferStatus.CREATED.valueOf(),
  TransferStatus.UPLOADED.valueOf(),
  TransferStatus.SENT.valueOf(),
];

const STATUS_DELETABLE_BY_RECEIVER_LOCALY = [
  TransferStatus.ACCEPTED.valueOf(),
  TransferStatus.RETRIEVED.valueOf(),
  TransferStatus.REFUSED.valueOf(),
];

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    private readonly bucketService: BucketService,
    @InjectRepository(FileTransfer)
    private fileTransferRepository: Repository<FileTransfer>,
    @InjectRepository(TransferLog)
    private transferLogRepository: Repository<TransferLog>,
    private userService: UserService,
    private recipientService: RecipientService,
    private dataSource: DataSource,
  ) {}

  // local transfer handling methods
  async getTransferList(userId: number): Promise<TransferDto[]> {
    const list = await this.fileTransferRepository.find({
      where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
      relations: ['sender', 'receiver'],
      order: {
        created_at: 'DESC',
      },
    });

    return await Promise.all(
      list.map((fileTransfer) => this.toDTO(fileTransfer)),
    );
  }

  async getTransferListByStatusAndCreationTime(
    status: TransferStatus[],
    createdBefore: Date,
  ): Promise<FileTransfer[]> {
    return this.fileTransferRepository.find({
      where: [
        {
          status: In(status),
          created_at: LessThan(createdBefore),
        },
      ],
    });
  }

  private async getTransferOfUser(transferId: string, userId: number) {
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
    return transfer;
  }

  async getTransferOfSenderDomain(
    transferId: string,
    domain: string,
  ): Promise<FileTransfer> {
    const transfer = await this.fileTransferRepository.findOne({
      where: { id: transferId },
      relations: ['sender', 'receiver'],
    });
    if (!transfer) {
      throw new NotFoundException(`Transfer with ID ${transferId} not found`);
    }
    if (
      'domain' in transfer.sender &&
      typeof transfer.sender.domain === 'string' &&
      transfer.sender.domain === domain
    ) {
      return transfer;
    }
    throw new UnauthorizedException(
      `Transfer sender domain does not match remote domain`,
    );
  }

  private async toDTO(transfer: FileTransfer): Promise<TransferDto> {
    const keys = await this.bucketService.listFiles(transfer.id);
    const logs = await this.transferLogRepository.find({
      where: { fileTransfer: { id: transfer.id } },
      order: { created_at: 'ASC' },
    });

    return {
      id: transfer.id,
      symmetric_key_encrypted: transfer.symmetric_key_encrypted,
      status: transfer.status,
      created_at: transfer.created_at,
      filename: transfer.filename,
      subject: transfer.subject,
      chunks: keys.map((key) => Number(key.split('/')[1])),
      senderId: transfer.sender.id,
      receiverId: transfer.receiver.id,
      senderAddress: this.recipientService.getRecipientAddress(transfer.sender),
      receiverAddress: this.recipientService.getRecipientAddress(
        transfer.receiver,
      ),
      size: transfer.size,
      logs: logs.map((log) => ({
        id: log.id,
        info: log.info,
        created_at: log.created_at,
      })),
    };
  }

  async getTransferInfo(id: string, userId: number): Promise<TransferDto> {
    return this.toDTO(await this.getTransferOfUser(id, userId));
  }

  async newTransfer(
    transferData: CreateTransferDto,
    senderId: number,
  ): Promise<TransferDto> {
    const sender = await this.userService.getCurrentUser(senderId);

    // get recipient user if it exists or create it
    const recipient = await this.recipientService.getOrCreateUser(
      transferData.recipient,
    );

    // Check if recipient key is trusted
    const isTrustedKey = await this.recipientService.isTrustedRecipientKey(
      senderId,
      recipient,
      transferData.recipient_public_key_hash,
    );
    if (!isTrustedKey) {
      if (transferData.trust_recipient_key) {
        await this.recipientService.addTrustedRecipient(
          sender,
          recipient,
          transferData.recipient_public_key_hash,
        );
      } else {
        throw new BadRequestException('User must trust recipient key');
      }
    }

    // Create transfer record
    let transfer = this.fileTransferRepository.create({
      symmetric_key_encrypted: transferData.symmetric_key_encrypted,
      status: TransferStatus.CREATED,
      filename: transferData.filename,
      subject: transferData.subject,
      sender: sender,
      receiver: recipient,
    });

    transfer = await this.fileTransferRepository.save(transfer);

    // Log transfer creation
    await this.createTransferLog(transfer, LogInfo.TRANSFER_CREATED, senderId);

    return this.toDTO(transfer);
  }

  async createTransferFromRemote(
    transferData: RemoteTransferDto,
    recipient: LocalUser,
    sender: RemoteUser,
  ) {
    // TODO refactor this method to use the newTransfer method
    const transfer = this.fileTransferRepository.create({
      symmetric_key_encrypted: transferData.symmetric_key_encrypted,
      status: TransferStatus.SENT,
      filename: transferData.filename,
      subject: transferData.subject,
      sender: sender,
      receiver: recipient,
      size: transferData.size,
      id: transferData.id,
    });

    const createdTransfer = await this.fileTransferRepository.save(transfer);

    // Log transfer reception
    await this.createTransferLog(
      createdTransfer,
      LogInfo.TRANSFER_SENT,
      sender.id,
    );
    // TODO: notify local recipient about new transfer
  }

  /**
   * @param chunk
   * @return the size in bytes of the chunk payload
   */
  private getChunkSize(chunk: BucketChunkData): number {
    return new Blob([JSON.stringify(chunk)]).size;
  }

  async uploadChunk(
    transferId: string,
    chunkData: ChunkDto,
    userId: number,
  ): Promise<void> {
    const transfer = await this.getTransferOfUser(transferId, userId);

    if (transfer.sender.id !== userId) {
      throw new UnauthorizedException(`User is not sender`);
    } else if (transfer.status != TransferStatus.CREATED) {
      throw new BadRequestException('Chunk upload already completed');
    }

    const bucketData: BucketChunkData = {
      data: chunkData.encryptedData,
      iv: chunkData.iv,
    };

    const chunkSize = this.getChunkSize(bucketData);
    // Number.MAX_VALUE > BigInt max value
    transfer.size = String(Number(transfer.size) + chunkSize);

    await this.bucketService.putObject(
      transfer.id + '/' + chunkData.chunkIndex,
      Buffer.from(JSON.stringify(bucketData)),
    );

    if (chunkData.isLastChunk) {
      transfer.status = TransferStatus.UPLOADED;
      await this.createTransferLog(transfer, LogInfo.TRANSFER_UPLOADED, userId);

      if (transfer.receiver instanceof LocalUser) {
        // TODO: notify local recipient about new transfer
        transfer.status = TransferStatus.SENT;
        await this.createTransferLog(transfer, LogInfo.TRANSFER_SENT, userId);
      }
      // TODO: notify remote server about new transfer
    }

    await this.fileTransferRepository.save(transfer);
  }

  async getChunk(
    transferId: string,
    chunkId: number,
    userId: number,
  ): Promise<Omit<ChunkDto, 'isLastChunk'>> {
    const transfer = await this.getTransferOfUser(transferId, userId);

    const path = await this.bucketService.getFile(transfer.id + '/' + chunkId);

    try {
      const data = await fs.readFile(path, 'utf8');
      const bucketData = JSON.parse(data) as BucketChunkData;

      return {
        chunkIndex: Number(chunkId),
        encryptedData: bucketData.data,
        iv: bucketData.iv,
      };
    } finally {
      await fs.unlink(path);
    }
  }

  private async createTransferLog(
    transfer: FileTransfer,
    info: LogInfo,
    userId?: number,
  ): Promise<TransferLog> {
    const log = {
      fileTransfer: transfer,
      info,
    };

    if (userId) {
      log['user'] = { id: userId } as User;
    }

    return await this.transferLogRepository.save(
      this.transferLogRepository.create(log),
    );
  }

  async acceptTransfer(id: string, userId: number): Promise<FileTransfer> {
    const transfer = await this.getTransferOfUser(id, userId);

    if (transfer.receiver.id !== userId) {
      throw new UnauthorizedException(
        'Only the receiver of a transfer can accept it',
      );
    }

    return this.acceptTransferLocally(transfer);
    // TODO: Retrieve file from remote server if transfer is not local
  }

  async acceptTransferLocally(transfer: FileTransfer) {
    // TODO: check if can be accepted
    if (transfer.status !== TransferStatus.SENT) {
      throw new BadRequestException(
        'Transfer is not pending acceptance or refusal',
      );
    }

    transfer.status = TransferStatus.ACCEPTED;
    await this.createTransferLog(
      transfer,
      LogInfo.TRANSFER_ACCEPTED,
      transfer.receiver.id,
    );

    if (transfer.sender instanceof LocalUser) {
      transfer.status = TransferStatus.RETRIEVED;
      await this.createTransferLog(
        transfer,
        LogInfo.TRANSFER_RETRIEVED,
        transfer.receiver.id,
      );
    }

    await this.fileTransferRepository.save(transfer);
    return transfer;
  }

  async refuseTransfer(id: string, userId: number): Promise<FileTransfer> {
    const transfer = await this.getTransferOfUser(id, userId);

    if (transfer.receiver.id !== userId) {
      throw new UnauthorizedException(
        'Only the receiver of a transfer can refuse it',
      );
    }

    return this.refuseTransferLocally(transfer);
    // TODO: Notify remote server about refusal if needed
  }

  async refuseTransferLocally(transfer: FileTransfer) {
    // TODO: checks if can be refused
    if (transfer.status !== TransferStatus.SENT) {
      throw new BadRequestException(
        'Transfer is not pending acceptance or refusal',
      );
    }

    transfer.status = TransferStatus.REFUSED;
    await this.fileTransferRepository.save(transfer);
    await this.createTransferLog(
      transfer,
      LogInfo.TRANSFER_REFUSED,
      transfer.receiver.id,
    );
    return transfer;
  }

  async deleteTransfer(id: string, userId: number) {
    const transfer = await this.getTransferOfUser(id, userId);
    const transferStatus = transfer.status.valueOf();

    const isUserSender = transfer.sender.id === userId;
    const isUserReceiver = transfer.receiver.id === userId;

    const isDeletable =
      (isUserSender &&
        STATUS_DELETABLE_BY_SENDER_LOCALY.includes(transferStatus)) ||
      (isUserReceiver &&
        STATUS_DELETABLE_BY_RECEIVER_LOCALY.includes(transferStatus));

    if (!isDeletable) {
      throw new UnauthorizedException(
        'User is not authorized to do this action',
      );
    }

    await this.deleteTransferLocally(transfer);
  }

  /**
   * Mark a transfer as deleted, but keep it in DB until expiration. Remove all associated chunks
   * @param transfer
   */
  async deleteTransferLocally(transfer: FileTransfer) {
    // TODO: check status of transfer if can be deleted by remote!
    await this.deleteTransferChunks(transfer.id);
    transfer.status = TransferStatus.DELETED;
    await this.fileTransferRepository.save(transfer);
    await this.createTransferLog(
      transfer,
      LogInfo.TRANSFER_DELETED,
      transfer.receiver.id,
    );
    return transfer;
  }

  /**
   * Delete all chunks related to a transfer
   * @private
   */
  private async deleteTransferChunks(transferId: string): Promise<void> {
    this.logger.log(`Removing all chunks from transfer ${transferId}`);
    const files = await this.bucketService.listFiles(transferId);
    await Promise.all(files.map((f) => this.bucketService.deleteFile(f)));
    this.logger.debug('All chunks successfully deleted');
  }

  /**
   * Mark a file transfer as expired and remove all associated chunks
   * @param transfer
   */
  async expireLocalTransfer(transfer: FileTransfer) {
    this.logger.log(`Expire file transfer ${transfer.id}`);
    await this.deleteTransferChunks(transfer.id);
    transfer.status = TransferStatus.EXPIRED;
    await this.fileTransferRepository.save(transfer);
    await this.createTransferLog(transfer, LogInfo.TRANSFER_EXPIRED);
  }

  /**
   * Permanently delete all information related to a local file transfer (logs, chunks and the entity itself)
   * @param transfer
   */
  async deleteLocalTransferPermanently(transfer: FileTransfer) {
    if (
      transfer.status.valueOf() !== TransferStatus.EXPIRED.valueOf() &&
      transfer.status.valueOf() !== TransferStatus.DELETED.valueOf()
    ) {
      this.logger.error(
        `Can't delete file transfer ${transfer.id}. It must first be in a deleted or expired status`,
      );
      return;
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .withRepository(this.transferLogRepository)
        .delete({
          fileTransfer: transfer,
        });

      await transactionalEntityManager
        .withRepository(this.fileTransferRepository)
        .delete(transfer);
    });
  }
}
