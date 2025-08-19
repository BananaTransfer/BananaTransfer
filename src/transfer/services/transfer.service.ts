import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

@Injectable()
export class TransferService {
  constructor(
    private readonly bucketService: BucketService,
    @InjectRepository(FileTransfer)
    private fileTransferRepository: Repository<FileTransfer>,
    @InjectRepository(TransferLog)
    private transferLogRepository: Repository<TransferLog>,
    private userService: UserService,
    private recipientService: RecipientService,
  ) {}

  // local transfer handling methods
  async getTransferList(userId: number): Promise<TransferDto[]> {
    const list = await this.fileTransferRepository.find({
      where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
      relations: ['sender', 'receiver'],
    });

    return await Promise.all(
      list.map((fileTransfer) => this.toDTO(fileTransfer)),
    );
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

  // TODO: do we still need this? don't we fetch now only the logs? can we rename the method then getTransferLogs?
  async getTransferDetails(
    transferId: string,
    userId: number,
  ): Promise<[FileTransfer, TransferLog[]]> {
    const transfer = await this.getTransferOfUser(transferId, userId);

    const logs = await this.transferLogRepository.find({
      where: { fileTransfer: { id: transferId } },
    });
    return [transfer, logs];
  }

  private async toDTO(transfer: FileTransfer): Promise<TransferDto> {
    const keys = await this.bucketService.listFiles(transfer.id);

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

    await this.bucketService.putObject(
      transfer.id + '/' + chunkData.chunkIndex,
      Buffer.from(JSON.stringify(bucketData)),
    );

    if (chunkData.isLastChunk) {
      transfer.status = TransferStatus.UPLOADED;
      await this.fileTransferRepository.save(transfer);
      await this.createTransferLog(transfer, LogInfo.TRANSFER_UPLOADED, userId);
      // TODO: notify local recipient about new transfer
      // TODO: notify remote server about new transfer
    }
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
    userId: number,
  ): Promise<TransferLog> {
    const log = this.transferLogRepository.create({
      fileTransfer: transfer,
      info,
      user: { id: userId } as User,
    });
    return await this.transferLogRepository.save(log);
  }

  acceptTransfer(id: string): string {
    // TODO: implement logic to accept a transfer by ID
    // accept transfer local
    // notify remote about it if needed
    return `Transfer with ID ${id} accepted`;
  }

  async acceptTransferLocally(transfer: FileTransfer) {
    // TODO: checks if can be accepted
    transfer.status = TransferStatus.ACCEPTED;
    await this.fileTransferRepository.save(transfer);
    await this.createTransferLog(
      transfer,
      LogInfo.TRANSFER_ACCEPTED,
      transfer.receiver.id,
    );
  }

  refuseTransfer(id: string): string {
    // TODO: implement logic to refuse a transfer by ID
    // refuse transfer local
    // notify remote about it if needed
    return `Transfer with ID ${id} refused`;
  }

  async refuseTransferLocally(transfer: FileTransfer) {
    // TODO: checks if can be refused
    transfer.status = TransferStatus.REFUSED;
    await this.fileTransferRepository.save(transfer);
    await this.createTransferLog(
      transfer,
      LogInfo.TRANSFER_REFUSED,
      transfer.receiver.id,
    );
  }

  deleteTransfer(id: string): string {
    // TODO: implement logic to delete a transfer by ID
    // delete transfer local
    // notify remote about it if needed
    return `Transfer with ID ${id} deleted`;
  }

  async deleteTransferLocally(transfer: FileTransfer) {
    // TODO: checks if can be deleted
    await this.fileTransferRepository.remove(transfer);
    await this.createTransferLog(
      transfer,
      LogInfo.TRANSFER_DELETED,
      transfer.receiver.id,
    );
  }
}
