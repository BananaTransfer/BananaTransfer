import { Module } from '@nestjs/common';
import { RemoteController } from './remote.controller';
import { RemoteService } from './remote.service';
import { TransferService } from '../transfer/transfer.service';
import { UserService } from '../user/user.service';

// This module handles all service related operations that are done by the external servers

@Module({
  providers: [RemoteService, TransferService, UserService],
  controllers: [RemoteController],
  exports: [RemoteService],
})
export class RemoteModule {}
