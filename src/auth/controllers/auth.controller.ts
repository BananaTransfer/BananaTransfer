import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@user/services/user.service';
import { LoginDto } from '@auth/dto/login.dto';
import { RegisterDto } from '@auth/dto/register.dto';

interface CsrfRequest extends Request {
  csrfToken: () => string;
  cookies: { [key: string]: string };
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  private renderLoginPage(
    req: CsrfRequest,
    res: Response,
    options: { username?: string; error?: string } = {},
  ) {
    const domain = this.userService.getDomain();
    return res.render('auth/login', {
      domain,
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
    const domain = this.userService.getDomain();
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
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: CsrfRequest,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.validateUser(
        loginDto.username,
        loginDto.password,
      );
      await this.authService.authenticateUser(user, res);
      return res.redirect('/transfer');
    } catch (err) {
      this.logger.error(err);
      return this.renderLoginPage(req, res, {
        username: loginDto.username,
        error: (err as { message: string }).message || 'Login failed',
      });
    }
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: CsrfRequest,
    @Res() res: Response,
  ) {
    try {
      // TODO: check if password match.

      const user = await this.authService.registerUser(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
      await this.authService.authenticateUser(user, res);
      return res.redirect('/transfer');
    } catch (err) {
      this.logger.error(err);
      return this.renderRegisterPage(req, res, {
        username: registerDto.username,
        email: registerDto.email,
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
