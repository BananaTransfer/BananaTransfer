import { Module } from '@nestjs/common';
import { Resolver } from 'dns/promises';

import { UserModule } from '@user/user.module';
import { TransferModule } from '@transfer/transfer.module';
import { RemoteController } from '@remote/controllers/remote.controller';
import {
  DevDnsService,
  DnsService,
  ProductionDnsService,
} from '@remote/services/dns.service';
import { RemoteInboundService } from './services/remoteInbound.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [UserModule, TransferModule],
  controllers: [RemoteController],
  providers: [
    {
      provide: Resolver,
      useFactory: () => new Resolver(),
    },
    {
      provide: DnsService,
      useFactory: (configService: ConfigService, resolver: Resolver) => {
        const isDev = configService.get('NODE_ENV') == 'dev';

        if (isDev) {
          return new DevDnsService(configService);
        }

        return new ProductionDnsService(resolver);
      },
      inject: [ConfigService, Resolver],
    },
    RemoteInboundService,
  ],
  exports: [],
})
export class RemoteInboundModule {}
