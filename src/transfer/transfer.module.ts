import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtCoreModule } from '@auth/jwt/jwt-core.module';
import { UserModule } from '@user/user.module';

import { TransferController } from '@transfer/controllers/transfer.controller';
import { TransferService } from '@transfer/services/transfer.service';

import { BucketService } from '@transfer/services/bucket.service';

import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';
import { ChunkInfo } from '@database/entities/chunk-info.entity';
import { User } from '@database/entities/user.entity';
import { DnsService } from '@transfer/services/dns.service';
import { Resolver } from 'dns/promises';
import { RemoteController } from '@transfer/controllers/remote.controller';

// This module handles all file sharing related operations that are done by the authenticated users

@Module({
  imports: [
    JwtCoreModule,
    UserModule,
    TypeOrmModule.forFeature([FileTransfer, TransferLog, ChunkInfo, User]),
  ],
  controllers: [TransferController, RemoteController],
  providers: [
    {
      provide: Resolver,
      useFactory: () => new Resolver(),
    },
    BucketService,
    TransferService,
    DnsService,
  ],
  exports: [TransferService],
})
export class TransferModule {}
