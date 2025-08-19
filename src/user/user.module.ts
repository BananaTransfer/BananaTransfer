import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtCoreModule } from '@auth/jwt/jwt-core.module';
import { Resolver } from 'dns/promises';

import { UserController } from '@user/controllers/user.controller';
import { UserService } from '@user/services/user.service';
import { RemoteUserService } from '@user/services/remoteUser.service';
import { PasswordService } from '@user/services/password.service';
import { HashKeyService } from './services/hashKey.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';
import { RecipientService } from '@user/services/recipient.service';
import { RemoteQueryService } from '@remote/services/remoteQuery.service';
import { DnsService } from '@remote/services/dns.service';

// This module handles all user related operations that are done by the authenticated users

@Module({
  imports: [
    JwtCoreModule,
    TypeOrmModule.forFeature([User, LocalUser, RemoteUser, TrustedRecipient]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    RemoteUserService,
    PasswordService,
    RecipientService,
    HashKeyService,
    RemoteQueryService,
    DnsService,
    {
      provide: Resolver,
      useFactory: () => new Resolver(),
    },
  ],
  exports: [UserService, PasswordService, RecipientService],
})
export class UserModule {}
