import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { UserService } from '../user/user.service';

import { User } from '../database/entities/user.entity';
import { LocalUser } from '../database/entities/local-user.entity';
import { RemoteUser } from '../database/entities/remote-user.entity';
import { TrustedRecipient } from '../database/entities/trusted-recipient.entity';
import { FileTransfer } from '../database/entities/file-transfer.entity';
import { TransferLog } from '../database/entities/transfer-log.entity';

// This module handles all file sharing related operations that are done by the authenticated users

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      LocalUser,
      RemoteUser,
      TrustedRecipient,
      FileTransfer,
      TransferLog,
    ]),
  ],
  controllers: [TransferController],
  providers: [TransferService, UserService],
  exports: [TransferService],
})
export class TransferModule {}
