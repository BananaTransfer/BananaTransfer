import { Module } from '@nestjs/common';

import { UserService } from './user.service';
import { UserController } from './user.controller';

// This module handles all user related operations that are done by the authenticated users

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
