import { Module } from '@nestjs/common';

import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { UserService } from '../user/user.service';

// This module handles all file sharing related operations that are done by the authenticated users

@Module({
  controllers: [TransferController],
  providers: [TransferService, UserService],
  exports: [TransferService],
})
export class TransferModule {}
