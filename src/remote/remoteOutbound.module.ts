import { Module } from '@nestjs/common';
import { Resolver } from 'dns/promises';

import {
  DevDnsService,
  DnsService,
  ProductionDnsService,
} from '@remote/services/dns.service';
import { RemoteOutboundService } from '@remote/services/remoteOutbound.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [],
  controllers: [],
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
    RemoteOutboundService,
  ],
  exports: [RemoteOutboundService],
})
export class RemoteOutboundModule {}
