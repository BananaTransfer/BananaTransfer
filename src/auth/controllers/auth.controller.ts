import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  Render,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@user/services/user.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('login')
  @Render('auth/login')
  renderLogin() {
    const domain = this.userService.getDomain();
    return { domain };
  }

  @Get('register')
  @Render('auth/register')
  renderRegister() {
    const domain = this.userService.getDomain();
    return { domain };
  }

  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.validateUser(username, password);
      const jwt = await this.authService.login(user);
      res.cookie('jwt', jwt.access_token, { httpOnly: true, secure: true });
      return res.redirect('/transfer');
    } catch (err) {
      this.logger.error(err);
      const domain = this.userService.getDomain();
      return res.status(401).render('auth/login', {
        domain,
        username,
        error: (err as { message: string }).message || 'Login failed',
      });
    }
  }

  @Post('register')
  async register(
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.registerUser(
        username,
        email,
        password,
      );
      const jwt = await this.authService.login(user);
      res.cookie('jwt', jwt.access_token, { httpOnly: true, secure: true });
      return res.redirect('/transfer');
    } catch (err) {
      this.logger.error(err);
      // Render register page with error message
      const domain = this.userService.getDomain();
      return res.status(400).render('auth/register', {
        domain,
        username,
        email,
        error: (err as { message: string }).message || 'Registration failed',
      });
    }
  }

  @Get('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    // TODO:this.authService.logout(req);
    res.redirect('/auth/login');
  }
}
