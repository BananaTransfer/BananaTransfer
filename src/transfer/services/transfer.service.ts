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
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';
import { BucketService } from '@transfer/services/bucket.service';
import TransferDto from '@transfer/dto/transfer.dto';
import CreateTransferDto from '@transfer/dto/create-transfer.dto';
import { UserService } from '@user/services/user.service';
import ChunkDto from '@transfer/dto/chunk.dto';
import * as fs from 'node:fs/promises';
import { RecipientService } from '@user/services/recipient.service';

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
    // TODO: implement logic to fetch list of all incoming and outgoing transfers of a user
    const list = await this.fileTransferRepository.find({
      where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
      relations: ['sender', 'receiver'],
    });

    return await Promise.all(
      list.map((fileTransfer) => this.toDTO(fileTransfer)),
    );
  }

  private async getTransfer(transferId: string, userId: number) {
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

  async getTransferDetails(
    transferId: string,
    userId: number,
  ): Promise<[FileTransfer, TransferLog[]]> {
    const transfer = await this.getTransfer(transferId, userId);

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
      signature_sender: transfer.signature_sender,
      status: transfer.status,
      created_at: transfer.created_at,
      filename: transfer.filename,
      subject: transfer.subject,
      chunks: keys.map((key) => Number(key.split('/')[1])),
      senderId: transfer.sender.id,
      receiverId: transfer.receiver.id,
    };
  }

  async getTransferInfo(id: string, userId: number): Promise<TransferDto> {
    return this.toDTO(await this.getTransfer(id, userId));
  }

  async newTransfer(
    transferData: CreateTransferDto,
    senderId: number,
  ): Promise<TransferDto> {
    const sender = await this.userService.getCurrentUser(senderId);
    const receiver = await this.recipientService.getUser(transferData.receiver);

    // Create transfer record
    let transfer = this.fileTransferRepository.create({
      symmetric_key_encrypted: transferData.symmetric_key_encrypted,
      status: TransferStatus.CREATED,
      filename: transferData.filename,
      subject: transferData.subject,
      sender: sender,
      receiver: receiver,
    });

    transfer = await this.fileTransferRepository.save(transfer);

    // Log transfer creation
    await this.createTransferLog(transfer, LogInfo.TRANSFER_CREATED, senderId);

    return this.toDTO(transfer);
  }

  async uploadChunk(
    transferId: string,
    chunkData: ChunkDto,
    userId: number,
  ): Promise<void> {
    const transfer = await this.getTransfer(transferId, userId);

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
    }
  }

  async getChunk(
    transferId: string,
    chunkId: number,
    userId: number,
  ): Promise<Omit<ChunkDto, 'isLastChunk'>> {
    const transfer = await this.getTransfer(transferId, userId);

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
    return `Transfer with ID ${id} accepted`;
  }

  refuseTransfer(id: string): string {
    // TODO: implement logic to refuse a transfer by ID
    return `Transfer with ID ${id} refused`;
  }

  deleteTransfer(id: string): string {
    // TODO: implement logic to delete a transfer by ID
    return `Transfer with ID ${id} deleted`;
  }
}
