import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtCoreModule } from '@auth/jwt/jwt-core.module';

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
import { RemoteModule } from '@remote/remote.module';
import { TransferModule } from '@transfer/transfer.module';

// This module handles all user related operations that are done by the authenticated users

@Module({
  imports: [
    JwtCoreModule,
    forwardRef(() => RemoteModule),
    forwardRef(() => TransferModule),
    TypeOrmModule.forFeature([User, LocalUser, RemoteUser, TrustedRecipient]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    RemoteUserService,
    PasswordService,
    RecipientService,
    HashKeyService,
  ],
  exports: [UserService, PasswordService, RecipientService, RemoteUserService],
})
export class UserModule {}
