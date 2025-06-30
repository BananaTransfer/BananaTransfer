import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { LocalAuthGuard } from '../auth/local-auth.guard';

// all routes in this controller are protected by the LocalAuthGuard and require authentication
@UseGuards(LocalAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Example endpoint to get user data
  @Get('user')
  getUser(): string {
    return this.userService.getUser();
  }
}
