import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';

import { TransferStatus } from '@database/entities/enums';
import { TransferService } from '@transfer/services/transfer.service';

const HOUR_TO_MS_MULTIPLIER = 60 * 60 * 1000;
const DAY_TO_MS_MULTIPLIER = 24 * HOUR_TO_MS_MULTIPLIER;

/**
 * Responsible to organize the scheduling of all expiration related task
 */
@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);
  private readonly transferExpiryCreatedHours: number;
  private readonly transferExpiryDays: number;
  private readonly transferLogExpiryDays: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly transferService: TransferService,
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

    this.logger.debug('PLOUGH');
    this.logger.debug(this.transferLogExpiryDays);
    this.logger.debug(this.transferExpiryDays);
    this.logger.debug(this.transferExpiryCreatedHours);
    this.logger.debug(this.transferExpiryCreatedHours * HOUR_TO_MS_MULTIPLIER);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireCreatedTransfers(): Promise<void> {
    this.logger.log('Starting expiration check for CREATED transfers');

    const expirationDate = new Date(
      Date.now() - this.transferExpiryCreatedHours * HOUR_TO_MS_MULTIPLIER,
    );

    // get transfer with
    const transferListToExpire =
      await this.transferService.getTransferListByStatusAndCreationTime(
        [TransferStatus.CREATED],
        expirationDate,
      );

    for (const transfer of transferListToExpire) {
      await this.transferService.expireLocalTransfer(transfer);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async expireOldTransfers(): Promise<void> {
    this.logger.log('Starting daily expiration check for old transfers');

    const expirationDate = new Date(
      Date.now() - this.transferExpiryDays * DAY_TO_MS_MULTIPLIER,
    );

    const transferListToExpire =
      await this.transferService.getTransferListByStatusAndCreationTime(
        [
          TransferStatus.UPLOADED,
          TransferStatus.ACCEPTED,
          TransferStatus.REFUSED,
          TransferStatus.SENT,
          TransferStatus.RETRIEVED,
        ],
        expirationDate,
      );

    for (const transfer of transferListToExpire) {
      await this.transferService.expireLocalTransfer(transfer);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupTransferLogs(): Promise<void> {
    this.logger.log('Starting cleanup of old transfer logs');

    const expirationDate = new Date(
      Date.now() - this.transferLogExpiryDays * DAY_TO_MS_MULTIPLIER,
    );

    const transferListToDeletePermanently =
      await this.transferService.getTransferListByStatusAndCreationTime(
        [TransferStatus.DELETED, TransferStatus.EXPIRED],
        expirationDate,
      );

    for (const transfer of transferListToDeletePermanently) {
      await this.transferService.deleteLocalTransferPermanently(transfer);
    }
  }

  @OnEvent('user.set-keys')
  async expireTransfersForUser(userId: number): Promise<number> {
    this.logger.log(`Expiring transfers for user ${userId} due to key change`);
    return await this.transferService.expireTransfersForUser(userId);
  }
}
