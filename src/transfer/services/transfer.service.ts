import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFile, unlink } from 'fs/promises';

import { TransferStatus, LogInfo } from '@database/entities/enums';
import { User } from '@database/entities/user.entity';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';
import { ChunkInfo } from '@database/entities/chunk-info.entity';
import { BucketService } from '@transfer/services/bucket.service';

@Injectable()
export class TransferService {
  constructor(
    private readonly bucketService: BucketService,
    @InjectRepository(FileTransfer)
    private fileTransferRepository: Repository<FileTransfer>,
    @InjectRepository(TransferLog)
    private transferLogRepository: Repository<TransferLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChunkInfo)
    private chunkInfoRepository: Repository<ChunkInfo>,
  ) {}

  // local transfer handling methods
  async getTransferList(userId: number): Promise<any[]> {
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

  async fetchTransfer(
    id: number,
    userId: number,
  ): Promise<{
    transfer: FileTransfer;
    chunks: Array<{ chunkIndex: number; encryptedData: string; iv: string }>;
  }> {
    // Find transfer where user is either sender or receiver
    const transfer = await this.fileTransferRepository.findOne({
      where: [
        { id, sender: { id: userId } },
        { id, receiver: { id: userId } },
      ],
      relations: ['sender', 'receiver'],
    });

    if (!transfer) {
      throw new NotFoundException(
        `Transfer with ID ${id} not found or access denied`,
      );
    }

    // Get transfer chunk metadata from database
    const chunks = await this.chunkInfoRepository.find({
      where: { fileTransfer: { id } },
      order: { chunkNumber: 'ASC' },
    });

    if (chunks.length === 0) {
      throw new NotFoundException(`Transfer ${id} has no uploaded chunks`);
    }

    // Download each chunk separately and return with metadata
    const chunkData = await Promise.all(
      chunks.map(async (chunk) => {
        const tempFile = await this.bucketService.getFile(chunk.s3Path);
        const data = await readFile(tempFile);
        await unlink(tempFile);

        return {
          chunkIndex: chunk.chunkNumber,
          encryptedData: data.toString('base64'),
          iv: chunk.iv || '', // Use stored IV
        };
      }),
    );

    // Mark transfer as retrieved after successful fetch
    if (transfer.status !== TransferStatus.RETRIEVED) {
      transfer.status = TransferStatus.RETRIEVED;
      await this.fileTransferRepository.save(transfer);
      
      await this.createTransferLog(
        transfer,
        LogInfo.TRANSFER_RETRIEVED,
        userId,
      );
    }

    return { transfer, chunks: chunkData };
  }

  async newTransfer(
    transferData: {
      filename: string;
      subject: string;
      recipientUsername: string;
      symmetricKeyEncrypted: string;
      signatureSender: string;
      fileContent?: Buffer;
      totalFileSize?: number;
    },
    senderId: number,
  ): Promise<FileTransfer> {
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    // TODO: Implement dns user lookup and put id here
    const recipient =
      (await this.userRepository.findOne({ where: { id: 2 } })) || sender;

    // Create transfer record
    const transfer = this.fileTransferRepository.create({
      filename: transferData.filename,
      subject: transferData.subject,
      symmetric_key_encrypted: transferData.symmetricKeyEncrypted,
      signature_sender: transferData.signatureSender,
      sender,
      receiver: recipient,
      status: TransferStatus.CREATED,
    });

    const savedTransfer = await this.fileTransferRepository.save(transfer);

    // Log transfer creation
    await this.createTransferLog(
      savedTransfer,
      LogInfo.TRANSFER_CREATED,
      senderId,
    );

    // Handle file upload if provided
    if (transferData.fileContent && transferData.fileContent.length > 0) {
      const s3Key = `transfers/${savedTransfer.id}/${transferData.filename}`;

      // Upload to S3 using existing BucketService
      await this.bucketService.putObject(s3Key, transferData.fileContent);

      // Update transfer with S3 path
      savedTransfer.s3_path = s3Key;
      await this.fileTransferRepository.save(savedTransfer);

      // Log successful upload
      await this.createTransferLog(
        savedTransfer,
        LogInfo.TRANSFER_CREATED,
        senderId,
      );
    }

    return savedTransfer;
  }

  // Chunked transfer handling chunks
  async handleChunkUpload(
    chunkData: {
      chunkData: Buffer;
      chunkIndex: number;
      isLastChunk: boolean;
      iv: string;
    },
    transferMetadata: {
      filename: string;
      subject: string;
      recipientUsername: string;
      symmetricKeyEncrypted: string;
      signatureSender: string;
      totalFileSize: number;
      totalChunks: number;
      chunkSize: number;
    } | null,
    senderId: number,
  ): Promise<FileTransfer | null> {
    let transfer: FileTransfer;

    // On first chunk, create the transfer record
    if (transferMetadata && chunkData.chunkIndex === 0) {
      transfer = await this.newTransfer(
        {
          filename: transferMetadata.filename,
          subject: transferMetadata.subject,
          recipientUsername: transferMetadata.recipientUsername,
          symmetricKeyEncrypted: transferMetadata.symmetricKeyEncrypted,
          signatureSender: transferMetadata.signatureSender,
          totalFileSize: transferMetadata.totalFileSize,
        },
        senderId,
      );
    } else {
      // Find existing transfer by looking for recent transfers from this user
      const existingTransfer = await this.fileTransferRepository.findOne({
        where: { sender: { id: senderId } },
        relations: ['sender', 'receiver'],
        order: { created_at: 'DESC' },
      });

      if (!existingTransfer) {
        throw new NotFoundException('Transfer not found for chunk upload');
      }

      transfer = existingTransfer;
    }

    // Upload chunk to S3
    const chunkKey = `transfers/${transfer.id}/chunks/chunk_${chunkData.chunkIndex}`;
    await this.bucketService.putObject(chunkKey, chunkData.chunkData);

    // Save chunk info to database
    const chunkInfo = this.chunkInfoRepository.create({
      chunkNumber: chunkData.chunkIndex,
      chunkSize: chunkData.chunkData.length,
      etag: 'chunk_etag',
      s3Path: chunkKey,
      isUploaded: true,
      iv: chunkData.iv,
      fileTransfer: transfer,
    });
    await this.chunkInfoRepository.save(chunkInfo);

    // If this is the last chunk, mark transfer as ready
    if (chunkData.isLastChunk) {
      transfer.status = TransferStatus.CREATED;
      await this.fileTransferRepository.save(transfer);

      console.log(`Transfer ${transfer.id} completed - all chunks stored`);
      return transfer;
    }

    return null; // Transfer not complete yet
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
