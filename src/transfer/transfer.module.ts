import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtCoreModule } from '@auth/jwt/jwt-core.module';
import { UserModule } from '@user/user.module';
import { RemoteOutboundModule } from '@remote/remoteOutbound.module';

import { TransferController } from '@transfer/controllers/transfer.controller';
import { TransferService } from '@transfer/services/transfer.service';
import { TransferChunkService } from '@transfer/services/transferChunk.service';
import { TransferLogService } from '@transfer/services/transferLog.service';
import { ExpirationService } from '@transfer/services/expiration.service';
import { BucketService } from '@transfer/services/bucket.service';

import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

// This module handles all file sharing related operations that are done by the authenticated users

@Module({
  imports: [
    JwtCoreModule,
    UserModule,
    RemoteOutboundModule,
    TypeOrmModule.forFeature([FileTransfer, TransferLog]),
  ],
  controllers: [TransferController],
  providers: [
    BucketService,
    TransferService,
    ExpirationService,
    TransferLogService,
    TransferChunkService,
  ],
  exports: [TransferService, TransferChunkService, ExpirationService],
})
export class TransferModule {}
