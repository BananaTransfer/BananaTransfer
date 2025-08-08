import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtCoreModule } from '@auth/jwt/jwt-core.module';
import { UserModule } from '@user/user.module';

import { AuthController } from '@auth/controllers/auth.controller';
import { AuthService } from '@auth/services/auth.service';
import { JwtAuthGuard } from '@auth/jwt/guards/jwt-auth.guard';

// This module handles authentication using Passport.js with a local strategy.

@Module({
  imports: [PassportModule, ConfigModule, UserModule, JwtCoreModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
