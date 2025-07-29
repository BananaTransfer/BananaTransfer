import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from '@auth/controllers/auth.controller';
import { AuthService } from '@auth/services/auth.service';
import { LocalStrategy } from '@auth/strategies/local.strategy';
import { LocalAuthGuard } from '@auth/guards/local-auth.guard';

// This module handles authentication using Passport.js with a local strategy.

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, LocalAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
