import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LogInfo } from '@database/entities/enums';
import { User } from '@database/entities/user.entity';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

@Injectable()
export class TransferLogService {
  constructor(
    @InjectRepository(TransferLog)
    private transferLogRepository: Repository<TransferLog>,
  ) {}

  async getTransferLogs(transfer: FileTransfer) {
    return await this.transferLogRepository.find({
      where: { fileTransfer: { id: transfer.id } },
      order: { created_at: 'ASC' },
    });
  }

  async createTransferLog(
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
}
