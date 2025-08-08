import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtCoreModule } from '@auth/jwt/jwt-core.module';

import { UserController } from '@user/controllers/user.controller';
import { UserService } from '@user/services/user.service';
import { PasswordService } from '@user/services/password.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

// This module handles all user related operations that are done by the authenticated users

@Module({
  imports: [
    JwtCoreModule,
    TypeOrmModule.forFeature([User, LocalUser, RemoteUser, TrustedRecipient]),
  ],
  controllers: [UserController],
  providers: [UserService, PasswordService],
  exports: [UserService, PasswordService],
})
export class UserModule {}
