import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './user.service';

// This module handles all user related operations that are done by the authenticated users

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
