import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@auth/auth.module';
import { UserModule } from '@user/user.module';

import { TransferController } from '@transfer/controllers/transfer.controller';
import { TransferService } from '@transfer/services/transfer.service';

import { BucketService } from '@transfer/bucket/bucket.service';

import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

// This module handles all file sharing related operations that are done by the authenticated users

@Module({
  imports: [
    AuthModule,
    UserModule,
    TypeOrmModule.forFeature([FileTransfer, TransferLog]),
  ],
  controllers: [TransferController],
  providers: [TransferService, BucketService],
  exports: [TransferService, BucketService],
})
export class TransferModule {}
