import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';

import { LogInfo, TransferStatus } from '@database/entities/enums';
import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

import { TransferChunkService } from '@transfer/services/transferChunk.service';
import { TransferLogService } from '@transfer/services/transferLog.service';
import { RemoteOutboundService } from '@remote/services/remoteOutbound.service';
import { UserService } from '@user/services/user.service';
import { RecipientService } from '@user/services/recipient.service';

import { TransferDto } from '@transfer/dto/transfer.dto';
import { CreateTransferDto } from '@transfer/dto/create-transfer.dto';
import { ChunkDto } from '@transfer/dto/chunk.dto';
import { RemoteTransferDto } from '@remote/dto/remoteTransfer.dto';

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
    private readonly transferChunkService: TransferChunkService,
    private readonly transferLogService: TransferLogService,
    @InjectRepository(FileTransfer)
    private fileTransferRepository: Repository<FileTransfer>,
    @InjectRepository(TransferLog)
    private transferLogRepository: Repository<TransferLog>,
    private userService: UserService,
    private recipientService: RecipientService,
    private dataSource: DataSource,
    private remoteOutboundService: RemoteOutboundService,
  ) {}

  // method to convert a FileTransfer object into a TransferDto object (which is sent to frontend)
  private async toTransferDto(
    transfer: FileTransfer,
    includeDetails: boolean,
  ): Promise<TransferDto> {
    const dto: TransferDto = {
      id: transfer.id,
      symmetric_key_encrypted: transfer.symmetric_key_encrypted,
      status: transfer.status,
      created_at: transfer.created_at,
      filename: transfer.filename,
      subject: transfer.subject,
      senderId: transfer.sender.id,
      receiverId: transfer.receiver.id,
      senderAddress: this.recipientService.getRecipientAddress(transfer.sender),
      receiverAddress: this.recipientService.getRecipientAddress(
        transfer.receiver,
      ),
      size: transfer.size,
    };

    if (includeDetails) {
      dto.chunks = await this.transferChunkService.listChunks(transfer.id);
      dto.logs = (await this.transferLogService.getTransferLogs(transfer)).map(
        (log) => ({
          id: log.id,
          info: log.info,
          created_at: log.created_at,
          user: log.user
            ? this.recipientService.getRecipientAddress(log.user)
            : 'system',
        }),
      );
    }

    return dto;
  }

  // method to get a transfer by id and check if user can access it
  async getTransferOfUser(transferId: string, userId: number) {
    const transfer = await this.fileTransferRepository.findOne({
      where: [
        { id: transferId, sender: { id: userId } },
        { id: transferId, receiver: { id: userId } },
      ],
      relations: ['sender', 'receiver'],
    });

    if (!transfer) {
      this.logger.warn(`Transfer with ID ${transferId} not found`);
      throw new NotFoundException(`Transfer with ID ${transferId} not found`);
    }

    return transfer;
  }

  // method go get a list of all transfers of a user
  async getTransferListOfUser(userId: number): Promise<TransferDto[]> {
    const list = await this.fileTransferRepository.find({
      where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
      relations: ['sender', 'receiver'],
      order: {
        created_at: 'DESC',
      },
    });

    return await Promise.all(
      list.map((fileTransfer) => this.toTransferDto(fileTransfer, false)),
    );
  }

  // method to get a transfer and logs of a user
  async getTransferOfUserDetails(
    id: string,
    userId: number,
  ): Promise<TransferDto> {
    const transfer = await this.getTransferOfUser(id, userId);
    const transferDto = await this.toTransferDto(transfer, true);
    return transferDto;
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

  // method to get a transfer by id and check if the recipient domain matches
  async getTransferOfRemoteDomain(
    transferId: string,
    remoteDomain: string,
  ): Promise<FileTransfer> {
    const transfer = await this.fileTransferRepository.findOne({
      where: { id: transferId },
      relations: ['sender', 'receiver'],
    });
    if (!transfer) {
      this.logger.warn(`Transfer with ID ${transferId} not found`);
      throw new NotFoundException(`Transfer with ID ${transferId} not found`);
    }
    if (
      !(transfer.receiver instanceof RemoteUser) ||
      transfer.receiver.domain !== remoteDomain
    ) {
      this.logger.warn(
        `Transfer recipient domain does not match remote domain ${remoteDomain}`,
      );
      throw new UnauthorizedException(
        `Transfer recipient domain does not match remote domain`,
      );
    }
    if (transfer.status !== TransferStatus.SENT) {
      this.logger.warn(`Transfer with ID ${transfer.id} is unavailable`);
      throw new NotFoundException(
        `Transfer with ID ${transfer.id} is unavailable`,
      );
    }
    return transfer;
  }

  // methods to manipulate transfers from frontend
  private rejectIfNotSender(transfer: FileTransfer, userId: number) {
    if (transfer.sender.id !== userId) {
      throw new UnauthorizedException(
        'Only the sender of a transfer can perform this action',
      );
    }
  }

  private rejectIfNotReceiver(transfer: FileTransfer, userId: number) {
    if (transfer.receiver.id !== userId) {
      throw new UnauthorizedException(
        'Only the receiver of a transfer can perform this action',
      );
    }
  }

  private rejectIfNotStatus(transfer: FileTransfer, status: TransferStatus) {
    if (transfer.status !== status) {
      throw new BadRequestException(`Transfer is not in ${status} status`);
    }
  }

  private async createFileTransfer(transferData: {
    id?: string;
    symmetric_key_encrypted: string;
    filename: string;
    subject: string;
    size?: string;
    sender: User;
    receiver: User;
  }): Promise<FileTransfer> {
    transferData['status'] = TransferStatus.CREATED;
    const transfer = await this.fileTransferRepository.save(
      this.fileTransferRepository.create(transferData),
    );
    // Log transfer creation
    await this.transferLogService.createTransferLog(
      transfer,
      LogInfo.TRANSFER_CREATED,
      transfer.sender.id,
    );
    return transfer;
  }

  async setTransferStatus(
    transfer: FileTransfer,
    status: TransferStatus,
    user?: User,
  ) {
    transfer.status = status;
    const logInfoKey = `TRANSFER_${status}` as keyof typeof LogInfo;
    const logInfo = LogInfo[logInfoKey];
    await this.transferLogService.createTransferLog(
      transfer,
      logInfo,
      user ? user.id : undefined,
    );
    await this.fileTransferRepository.save(transfer);
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
        this.logger.warn(
          `User ${sender.id} (${sender.username}) must trust recipient key`,
        );
        throw new BadRequestException('User must trust recipient key');
      }
    }

    // Create transfer record
    const transfer = await this.createFileTransfer({
      symmetric_key_encrypted: transferData.symmetric_key_encrypted,
      filename: transferData.filename,
      subject: transferData.subject,
      sender,
      receiver: recipient,
    });

    return this.toTransferDto(transfer, false);
  }

  async newTransferFromRemote(
    transferData: RemoteTransferDto,
    recipient: LocalUser,
    sender: RemoteUser,
  ) {
    const transfer = await this.createFileTransfer({
      symmetric_key_encrypted: transferData.symmetric_key_encrypted,
      filename: transferData.filename,
      subject: transferData.subject,
      sender,
      receiver: recipient,
      size: transferData.size,
      id: transferData.id,
    });

    await this.setTransferStatus(transfer, TransferStatus.SENT, sender);

    // TODO: send notification to local recipient about new transfer
  }

  async uploadChunk(
    transferId: string,
    chunkData: ChunkDto,
    userId: number,
  ): Promise<void> {
    const transfer = await this.getTransferOfUser(transferId, userId);
    this.rejectIfNotSender(transfer, userId);
    this.rejectIfNotStatus(transfer, TransferStatus.CREATED);

    const chunkSize = await this.transferChunkService.saveChunk(
      transfer.id,
      chunkData,
    );
    // Number.MAX_VALUE > BigInt max value
    transfer.size = String(Number(transfer.size) + chunkSize);
    await this.fileTransferRepository.save(transfer);

    if (chunkData.isLastChunk) {
      await this.setTransferStatus(
        transfer,
        TransferStatus.UPLOADED,
        transfer.sender,
      );

      if (transfer.receiver instanceof LocalUser) {
        // TODO: send notification to local recipient about new transfer
        await this.setTransferStatus(transfer, TransferStatus.SENT);
      } else if (transfer.receiver instanceof RemoteUser) {
        await this.sendTransferToRemote(transfer);
      }
    }
  }

  async getChunk(
    transferId: string,
    chunkId: number,
    userId: number,
  ): Promise<ChunkDto> {
    const transfer = await this.getTransferOfUser(transferId, userId);
    this.rejectIfNotReceiver(transfer, userId);

    return this.transferChunkService.fetchChunk(transfer.id, chunkId);
  }

  private async sendTransferToRemote(transfer: FileTransfer) {
    try {
      await this.remoteOutboundService.newRemoteTransfer(transfer);
      await this.setTransferStatus(
        transfer,
        TransferStatus.SENT,
        transfer.sender,
      );
    } catch (error) {
      this.logger.error(
        `Error sending transfer ${transfer.id} to remote: ${(error as Error).message}`,
      );
      await this.transferLogService.createTransferLog(
        transfer,
        LogInfo.TRANSFER_SENT_FAILED,
        transfer.receiver.id,
      );
      throw new InternalServerErrorException(
        'Error sending transfer to remote',
      );
    }
  }

  private async fetchTransferFromRemote(transfer: FileTransfer) {
    try {
      if (transfer.sender instanceof RemoteUser) {
        // await this.remoteOutboundService.fetchRemoteTransfer(transfer);
        // fetch chunk information of transfer from remote server
        const transferInfo =
          await this.remoteOutboundService.fetchRemoteTransferInfo(transfer);

        let fetchedSize: number = 0;
        // loop to fetch and save chunks
        for (const chunkId of transferInfo.chunks) {
          const chunkData =
            await this.remoteOutboundService.fetchRemoteTransferChunk(
              transfer,
              chunkId,
            );

          const chunkSize = await this.transferChunkService.saveChunk(
            transfer.id,
            chunkData,
          );

          // check if the fetched size exceeds the originally indicated transfer size
          fetchedSize += chunkSize;
          if (fetchedSize > Number(transfer.size)) {
            this.logger.error(
              `Fetched size ${fetchedSize} exceeds originally indicated transfer size ${transfer.size}`,
            );
            throw new Error(
              `Fetched size ${fetchedSize} exceeds originally indicated transfer size ${transfer.size}`,
            );
          }
        }

        await this.setTransferStatus(
          transfer,
          TransferStatus.RETRIEVED,
          transfer.receiver,
        );
        // inform remote server that transfer has been retrieved
        await this.remoteOutboundService.informRemoteTransferRetrieved(
          transfer,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error fetching transfer ${transfer.id} from remote: ${(error as Error).message}`,
      );
      await this.transferLogService.createTransferLog(
        transfer,
        LogInfo.TRANSFER_RETRIEVED_FAILED,
        transfer.receiver.id,
      );
      // delete the already fetched chunks
      await this.transferChunkService.deleteTransferChunks(transfer.id);
      throw new InternalServerErrorException('Error fetching remote transfer');
    }
  }

  async sendTransfer(id: string, userId: number): Promise<FileTransfer> {
    const transfer = await this.getTransferOfUser(id, userId);
    this.rejectIfNotSender(transfer, userId);
    this.rejectIfNotStatus(transfer, TransferStatus.UPLOADED);

    await this.sendTransferToRemote(transfer);

    return transfer;
  }

  async acceptTransfer(id: string, userId: number): Promise<FileTransfer> {
    const transfer = await this.getTransferOfUser(id, userId);
    this.rejectIfNotReceiver(transfer, userId);
    this.rejectIfNotStatus(transfer, TransferStatus.SENT);

    await this.setTransferStatus(
      transfer,
      TransferStatus.ACCEPTED,
      transfer.receiver,
    );

    if (transfer.sender instanceof LocalUser) {
      await this.setTransferStatus(
        transfer,
        TransferStatus.RETRIEVED,
        transfer.receiver,
      );
    } else if (transfer.sender instanceof RemoteUser) {
      await this.fetchTransferFromRemote(transfer); /*.catch((error) => {
        this.logger.error(
          `Error fetching transfer ${transfer.id} from remote: ${(error as Error).message}`,
        );
      });*/
    }

    return transfer;
  }

  async refuseTransfer(id: string, userId: number): Promise<FileTransfer> {
    const transfer = await this.getTransferOfUser(id, userId);
    this.rejectIfNotReceiver(transfer, userId);
    this.rejectIfNotStatus(transfer, TransferStatus.SENT);

    await this.setTransferStatus(
      transfer,
      TransferStatus.REFUSED,
      transfer.receiver,
    );

    // delete transfer if it is local
    if (transfer.sender instanceof LocalUser) {
      await this.transferChunkService.deleteTransferChunks(transfer.id);
      await this.setTransferStatus(
        transfer,
        TransferStatus.DELETED,
        transfer.receiver,
      );
    }

    return transfer;
  }

  async retrieveTransfer(id: string, userId: number): Promise<FileTransfer> {
    const transfer = await this.getTransferOfUser(id, userId);
    this.rejectIfNotReceiver(transfer, userId);
    this.rejectIfNotStatus(transfer, TransferStatus.ACCEPTED);

    await this.fetchTransferFromRemote(transfer); /*.catch((error) => {
      this.logger.error(
        `Error fetching transfer ${transfer.id} from remote: ${(error as Error).message}`,
      );
    });*/
    return transfer;
  }

  async deleteTransfer(id: string, userId: number) {
    const user = await this.userService.getCurrentUser(userId);
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
      this.logger.warn(
        `User ${userId} is not authorized to delete transfer ${id}`,
      );
      throw new UnauthorizedException(
        'User is not authorized to do this action',
      );
    }

    await this.transferChunkService.deleteTransferChunks(transfer.id);
    await this.setTransferStatus(transfer, TransferStatus.DELETED, user);

    return transfer;
  }

  // TODO: for me we should move those methods to another service
  /**
   * Mark a file transfer as expired and remove all associated chunks
   * @param transfer
   */
  async expireLocalTransfer(transfer: FileTransfer) {
    this.logger.log(`Expire file transfer ${transfer.id}`);

    await this.transferChunkService.deleteTransferChunks(transfer.id);

    transfer.status = TransferStatus.EXPIRED;
    await this.fileTransferRepository.save(transfer);

    await this.transferLogService.createTransferLog(
      transfer,
      LogInfo.TRANSFER_EXPIRED,
    );
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

    // TODO: separate this somehow, transfer service shouldn't access transfer log repository
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

  /**
   * Expire all active transfers for a user when their public key changes
   * @param userId
   */
  async expireTransfersForUser(userId: number): Promise<number> {
    this.logger.log(`Expiring transfers for user ${userId} due to key change`);

    const activeStatuses = [
      TransferStatus.SENT,
      TransferStatus.ACCEPTED,
      TransferStatus.RETRIEVED,
    ];

    const transfersToExpire = await this.fileTransferRepository.find({
      where: {
        receiver: { id: userId },
        status: In(activeStatuses),
      },
    });

    this.logger.debug(
      `Found ${transfersToExpire.length} transfers to expire for user ${userId}`,
    );

    for (const transfer of transfersToExpire) {
      await this.expireLocalTransfer(transfer);
    }

    return transfersToExpire.length;
  }
}
