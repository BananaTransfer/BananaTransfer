import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtCoreModule } from '@auth/jwt/jwt-core.module';
import { UserModule } from '@user/user.module';

import { TransferController } from '@transfer/controllers/transfer.controller';
import { TransferService } from '@transfer/services/transfer.service';

import { BucketService } from '@transfer/services/bucket.service';

import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

// This module handles all file sharing related operations that are done by the authenticated users

@Module({
  imports: [
    JwtCoreModule,
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([FileTransfer, TransferLog]),
  ],
  controllers: [TransferController],
  providers: [BucketService, TransferService],
  exports: [TransferService],
})
export class TransferModule {}
