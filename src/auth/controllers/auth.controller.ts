import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from '@auth/services/auth.service';
import { LocalAuthGuard } from '@auth/guards/local-auth.guard';
import { UserService } from '@user/services/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('login')
  renderLogin(@Res() res: Response): void {
    const domain = this.userService.getDomain();
    res.render('auth/login', { domain });
  }

  @Get('register')
  renderRegister(@Res() res: Response): void {
    const domain = this.userService.getDomain();
    res.render('auth/register', { domain });
  }

  @Post('login')
  login(@Req() req: Request, @Res() res: Response) {
    // TODO: this.authService.login(req.user);
    res.redirect('/transfer');
  }

  @Post('register')
  register(@Req() req: Request, @Res() res: Response) {
    // TODO: this.authService.register(req.body);
    res.redirect('/transfer');
  }

  // This route is protected by the LocalAuthGuard
  @UseGuards(LocalAuthGuard)
  @Get('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    // TODO:this.authService.logout(req);
    res.redirect('/auth/login');
  }
}
