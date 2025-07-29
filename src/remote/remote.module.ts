import { Module } from '@nestjs/common';

import { RemoteController } from '@remote/controllers/remote.controller';
import { RemoteService } from '@remote/services/remote.service';
import { TransferService } from '@transfer/services/transfer.service';
import { UserService } from '@user/services/user.service';

// This module handles all service related operations that are done by the external servers

@Module({
  controllers: [RemoteController],
  providers: [RemoteService, TransferService, UserService],
  exports: [RemoteService],
})
export class RemoteModule {}
