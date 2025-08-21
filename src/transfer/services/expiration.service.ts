import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';
import { TransferStatus, LogInfo } from '@database/entities/enums';
import { BucketService } from '@transfer/services/bucket.service';

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);
  private readonly transferExpiryCreatedHours: number;
  private readonly transferExpiryDays: number;
  private readonly transferLogExpiryDays: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly bucketService: BucketService,
    @InjectRepository(FileTransfer)
    private readonly fileTransferRepository: Repository<FileTransfer>,
    @InjectRepository(TransferLog)
    private readonly transferLogRepository: Repository<TransferLog>,
  ) {
    this.transferExpiryCreatedHours = this.configService.get<number>(
      'TRANSFER_EXPIRY_CREATED_HOURS',
      24,
    );
    this.transferExpiryDays = this.configService.get<number>(
      'TRANSFER_EXPIRY_DAYS',
      30,
    );
    this.transferLogExpiryDays = this.configService.get<number>(
      'TRANSFER_LOG_EXPIRY_DAYS',
      60,
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireCreatedTransfers(): Promise<void> {
    this.logger.log('Starting expiration check for CREATED transfers');

    const expirationDate = new Date();
    expirationDate.setHours(
      expirationDate.getHours() - this.transferExpiryCreatedHours,
    );

    const expiredTransfers = await this.fileTransferRepository.find({
      where: {
        status: TransferStatus.CREATED,
        created_at: LessThan(expirationDate),
      },
    });

    for (const transfer of expiredTransfers) {
      await this.expireTransfer(transfer);
    }

    if (expiredTransfers.length > 0) {
      this.logger.log(
        `Expired ${expiredTransfers.length} CREATED transfers older than ${this.transferExpiryCreatedHours} hours`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async expireOldTransfers(): Promise<void> {
    this.logger.log('Starting daily expiration check for old transfers');

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - this.transferExpiryDays);

    const expiredTransfers = await this.fileTransferRepository.find({
      where: {
        status: TransferStatus.UPLOADED,
        created_at: LessThan(expirationDate),
      },
    });

    const sentTransfers = await this.fileTransferRepository.find({
      where: {
        status: TransferStatus.SENT,
        created_at: LessThan(expirationDate),
      },
    });

    const acceptedTransfers = await this.fileTransferRepository.find({
      where: {
        status: TransferStatus.ACCEPTED,
        created_at: LessThan(expirationDate),
      },
    });

    const allExpiredTransfers = [
      ...expiredTransfers,
      ...sentTransfers,
      ...acceptedTransfers,
    ];

    for (const transfer of allExpiredTransfers) {
      await this.expireTransfer(transfer);
    }

    if (allExpiredTransfers.length > 0) {
      this.logger.log(
        `Expired ${allExpiredTransfers.length} transfers older than ${this.transferExpiryDays} days`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupTransferLogs(): Promise<void> {
    this.logger.log('Starting cleanup of old transfer logs');

    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() - this.transferLogExpiryDays,
    );

    const result = await this.transferLogRepository
      .createQueryBuilder()
      .delete()
      .from(TransferLog)
      .where('created_at < :expirationDate', { expirationDate })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(
        `Deleted ${result.affected} transfer logs older than ${this.transferLogExpiryDays} days`,
      );
    }
  }

  private async expireTransfer(transfer: FileTransfer): Promise<void> {
    try {
      await this.deleteTransferFiles(transfer.id);

      transfer.status = TransferStatus.EXPIRED;
      await this.fileTransferRepository.save(transfer);

      const expirationLog = this.transferLogRepository.create({
        fileTransfer: transfer,
        info: LogInfo.TRANSFER_EXPIRED,
      });
      await this.transferLogRepository.save(expirationLog);

      this.logger.debug(`Expired transfer ${transfer.id}`);
    } catch (error) {
      this.logger.error(`Failed to expire transfer ${transfer.id}:`, error);
    }
  }

  private async deleteTransferFiles(transferId: string): Promise<void> {
    try {
      const files = await this.bucketService.listFiles(transferId);
      for (const file of files) {
        await this.bucketService.deleteFile(file);
      }
      this.logger.debug(
        `Deleted ${files.length} files for transfer ${transferId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to delete files for transfer ${transferId}:`,
        error,
      );
    }
  }

  // TODO - For expiring during key rotation in another issue
  async expireTransferManually(transferId: string): Promise<void> {
    const transfer = await this.fileTransferRepository.findOne({
      where: { id: transferId },
    });

    if (!transfer) {
      throw new Error(`Transfer ${transferId} not found`);
    }

    await this.expireTransfer(transfer);
    this.logger.log(`Manually expired transfer ${transferId}`);
  }
}
