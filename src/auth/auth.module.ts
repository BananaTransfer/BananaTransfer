import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { LocalAuthGuard } from './local-auth.guard';

// This module handles authentication using Passport.js with a local strategy.

@Module({
  imports: [PassportModule],
  providers: [AuthService, LocalStrategy, LocalAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
