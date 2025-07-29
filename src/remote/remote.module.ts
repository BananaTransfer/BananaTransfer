import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RemoteController } from '@remote/controllers/remote.controller';
import { RemoteService } from '@remote/services/remote.service';
import { TransferService } from '@transfer/services/transfer.service';
import { UserService } from '@user/services/user.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

// This module handles all service related operations that are done by the external servers

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
  controllers: [RemoteController],
  providers: [RemoteService, TransferService, UserService],
  exports: [RemoteService],
})
export class RemoteModule {}
