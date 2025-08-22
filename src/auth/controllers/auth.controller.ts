import { Controller, Get, Post, Req, Res, Body, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@user/services/user.service';
import { CsrfRequest } from '@auth/types/csrf-request.interface';
import { LoginDto } from '@auth/dto/login.dto';
import { RegisterDto } from '@auth/dto/register.dto';

@Controller('auth')
export class AuthController {
  private readonly envDomain: string;
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    this.envDomain = this.configService.getOrThrow<string>('DOMAIN');
  }

  private renderLoginPage(
    req: CsrfRequest,
    res: Response,
    options: { username?: string; error?: string } = {},
  ) {
    return res.render('auth/login', {
      domain: this.envDomain,
      csrfToken: req.csrfToken(),
      username: options.username,
      error: options.error,
    });
  }

  private renderRegisterPage(
    req: CsrfRequest,
    res: Response,
    options: { username?: string; email?: string; error?: string } = {},
  ) {
    const domain = this.envDomain;
    return res.render('auth/register', {
      domain,
      csrfToken: req.csrfToken(),
      username: options.username,
      email: options.email,
      error: options.error,
    });
  }

  @Get('login')
  async getLogin(@Req() req: CsrfRequest, @Res() res: Response) {
    const token = req.cookies?.jwt;
    if (token) {
      try {
        // Verify the JWT token and redirect to transfer if user already authenticated
        await this.authService.verifyJwt(token);
        return res.redirect('/transfer');
      } catch {
        // Token invalid, fall through to render login
      }
    }
    return this.renderLoginPage(req, res);
  }

  @Get('register')
  async getRegister(@Req() req: CsrfRequest, @Res() res: Response) {
    const token = req.cookies?.jwt;
    if (token) {
      try {
        // Verify the JWT token and redirect to transfer if user already authenticated
        await this.authService.verifyJwt(token);
        return res.redirect('/transfer');
      } catch {
        // Token invalid, fall through to render register
      }
    }
    return this.renderRegisterPage(req, res);
  }

  @Post('login')
  async login(
    @Req() req: CsrfRequest,
    @Res() res: Response,
    @Body() loginDto: LoginDto,
  ) {
    try {
      const user = await this.authService.validateUser(
        loginDto.username,
        loginDto.password,
      );
      this.logger.log(`User logged in: ${user.username}`);
      await this.userService.setLastLogin(user.id);
      await this.authService.authenticateUser(user, res);
      return res.redirect('/transfer');
    } catch (error) {
      this.logger.warn('Error logging in user', error);
      return this.renderLoginPage(req, res, {
        username: loginDto.username,
        error: (error as { message: string }).message || 'Login failed',
      });
    }
  }

  @Post('register')
  async register(
    @Req() req: CsrfRequest,
    @Res() res: Response,
    @Body() registerDto: RegisterDto,
  ) {
    try {
      const user = await this.userService.createUser(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
      this.logger.log(`User registered: ${user.username}`);
      await this.authService.authenticateUser(user, res);
      return res.redirect('/transfer');
    } catch (error) {
      this.logger.warn('Error registering user', error);
      return this.renderRegisterPage(req, res, {
        username: registerDto.username,
        email: registerDto.email,
        error: (error as { message: string }).message || 'Registration failed',
      });
    }
  }

  @Get('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    // clear the JWT cookie
    res.clearCookie('jwt');
    res.redirect('/auth/login');
  }
}
