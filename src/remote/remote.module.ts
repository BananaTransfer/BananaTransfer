import { Module } from '@nestjs/common';
import { Resolver } from 'dns/promises';

import { UserModule } from '@user/user.module';
import { TransferModule } from '@transfer/transfer.module';
import { RemoteController } from '@remote/controllers/remote.controller';
import { DnsService } from '@remote/services/dns.service';
import { RemoteService } from '@remote/services/remote.service';

@Module({
  imports: [UserModule, TransferModule],
  controllers: [RemoteController],
  providers: [
    {
      provide: Resolver,
      useFactory: () => new Resolver(),
    },
    DnsService,
    RemoteService,
  ],
})
export class RemoteModule {}
