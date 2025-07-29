import { Module } from '@nestjs/common';
import { UserModule } from '@user/user.module';
import { TransferModule } from '@transfer/transfer.module';

import { RemoteController } from '@remote/controllers/remote.controller';
import { RemoteService } from '@remote/services/remote.service';

// This module handles all service related operations that are done by the external servers

@Module({
  imports: [TransferModule, UserModule],
  controllers: [RemoteController],
  providers: [RemoteService],
  exports: [RemoteService],
})
export class RemoteModule {}
