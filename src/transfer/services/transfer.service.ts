import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFile, unlink } from 'fs/promises';

import { TransferStatus, LogInfo } from '@database/entities/enums';
import { User } from '@database/entities/user.entity';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';
import { BucketService } from '@transfer/services/bucket.service';

interface ChunkData {
  chunkIndex: number;
  encryptedData: string;
  iv: string;
}

@Injectable()
export class TransferService {
  // Temporary storage for chunks during upload
  private pendingTransfers = new Map<number, ChunkData[]>();

  constructor(
    private readonly bucketService: BucketService,
    @InjectRepository(FileTransfer)
    private fileTransferRepository: Repository<FileTransfer>,
    @InjectRepository(TransferLog)
    private transferLogRepository: Repository<TransferLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

    if (!transfer.s3_path) {
      throw new NotFoundException(`Transfer ${id} has no uploaded file`);
    }

    // Download single json file from S3
    const tempFile = await this.bucketService.getFile(transfer.s3_path);
    const jsonData = await readFile(tempFile, 'utf8');
    await unlink(tempFile);

    const transferData = JSON.parse(jsonData) as {
      chunks: ChunkData[];
    };

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

    return { transfer, chunks: transferData.chunks };
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

  // Simplified chunk handling - collect in memory, save as single JSON
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

    // On first chunk, create transfer and initialize chunk collection
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

      // Initialize chunk collection for this transfer
      this.pendingTransfers.set(transfer.id, []);
    } else {
      // Find existing transfer
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

    // Store chunk in memory
    const chunks = this.pendingTransfers.get(transfer.id) || [];
    chunks.push({
      chunkIndex: chunkData.chunkIndex,
      encryptedData: chunkData.chunkData.toString('base64'),
      iv: chunkData.iv,
    });

    // If last chunk, save everything as single JSON
    if (chunkData.isLastChunk) {
      // Sort chunks by index
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

      // Create transfer JSON
      const transferJson = {
        transfer: {
          filename: transfer.filename,
          totalSize: chunks.reduce(
            (total, chunk) => total + chunk.encryptedData.length,
            0,
          ),
          symmetricKeyEncrypted: transfer.symmetric_key_encrypted,
          signatureSender: transfer.signature_sender,
        },
        chunks: chunks,
      };

      // Save to S3
      const jsonKey = `transfers/${transfer.id}/transfer.json`;
      await this.bucketService.putObject(
        jsonKey,
        Buffer.from(JSON.stringify(transferJson)),
      );

      // Update transfer
      transfer.s3_path = jsonKey;
      transfer.status = TransferStatus.CREATED;
      await this.fileTransferRepository.save(transfer);

      // Cleanup memory
      this.pendingTransfers.delete(transfer.id);

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
