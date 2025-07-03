import { Controller, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Request } from 'express';

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
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
