import { forwardRef, Module } from '@nestjs/common';
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
import { RemoteQueryService } from '@remote/services/remoteQuery.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [forwardRef(() => UserModule), forwardRef(() => TransferModule)],
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
    RemoteQueryService,
  ],
  exports: [RemoteQueryService],
})
export class RemoteModule {}
