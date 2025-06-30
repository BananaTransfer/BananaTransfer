import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('login')
  /*async login(@Body() body: any) {
    // Replace with your DTO and validation
    return this.authService.login(body);
  }*/

  // This route is protected by the LocalAuthGuard
  @UseGuards(LocalAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
