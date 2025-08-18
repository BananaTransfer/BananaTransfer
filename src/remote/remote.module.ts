import { Module } from '@nestjs/common';
import { Resolver } from 'dns/promises';

import { UserModule } from '@user/user.module';
import { TransferModule } from '@transfer/transfer.module';
import { RemoteController } from '@remote/controllers/remote.controller';
import { DnsService } from '@remote/services/dns.service';
import { RemoteInboundService } from './services/remoteInbound.service';
import { RemoteQueryService } from '@remote/services/remoteQuery.service';

@Module({
  imports: [UserModule, TransferModule],
  controllers: [RemoteController],
  providers: [
    {
      provide: Resolver,
      useFactory: () => new Resolver(),
    },
    DnsService,
    RemoteInboundService,
    RemoteQueryService,
  ],
})
export class RemoteModule {}
