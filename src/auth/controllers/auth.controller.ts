import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Render,
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
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('login')
  @Render('auth/login')
  renderLogin(@Req() req: CsrfRequest) {
    const domain = this.userService.getDomain();
    return { domain, csrfToken: req.csrfToken() };
  }

  @Get('register')
  @Render('auth/register')
  renderRegister(@Req() req: CsrfRequest) {
    const domain = this.userService.getDomain();
    return { domain, csrfToken: req.csrfToken() };
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
      const jwt = await this.authService.login(user);
      res.cookie('jwt', jwt.access_token, {
        httpOnly: true,
        sameSite: 'strict',
        // secure prevents the cookie to be sent in non https requests, this needs to be disabled in dev
        secure: process.env.NODE_ENV !== 'dev',
      });
      return res.redirect('/transfer');
    } catch (err) {
      this.logger.error(err);
      const domain = this.userService.getDomain();
      return res.status(401).render('auth/login', {
        domain,
        username: loginDto.username,
        csrfToken: req.csrfToken(),
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
      const user = await this.authService.registerUser(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
      const jwt = await this.authService.login(user);
      res.cookie('jwt', jwt.access_token, {
        httpOnly: true,
        sameSite: 'strict',
        // secure prevents the cookie to be sent in non https requests, this needs to be disabled in dev
        secure: process.env.NODE_ENV !== 'dev',
      });
      return res.redirect('/transfer');
    } catch (err) {
      this.logger.error(err);
      // Render register page with error message
      const domain = this.userService.getDomain();
      return res.status(400).render('auth/register', {
        domain,
        username: registerDto.username,
        email: registerDto.email,
        csrfToken: req.csrfToken(),
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
