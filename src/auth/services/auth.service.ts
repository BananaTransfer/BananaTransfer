import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

import { UserPayload } from '@auth/types/user-payload.type';
import { PasswordService } from '@user/services/password.service';
import { UserService } from '@user/services/user.service';
import { UserStatus } from '@database/entities/enums';
import { LocalUser } from '@database/entities/local-user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async verifyJwt(token: string): Promise<UserPayload> {
    this.logger.debug('Verifying JWT token');
    return this.jwtService.verifyAsync<UserPayload>(token);
  }

  private async signJwt(payload: UserPayload): Promise<string> {
    this.logger.debug(`Signing JWT for user: ${payload.username}`);
    return this.jwtService.signAsync(payload);
  }

  async validateUser(username: string, password: string): Promise<LocalUser> {
    this.logger.debug(`Validating user: ${username}`);
    const user = await this.userService.findByUsername(username);
    if (
      !user ||
      !(await this.passwordService.validatePassword(user, password))
    ) {
      this.logger.warn(`Invalid login attempt for user: ${username}`);
      throw new UnauthorizedException('Invalid username or password');
    }
    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn(`Inactive user attempted login: ${username}`);
      throw new UnauthorizedException('User is not active');
    }
    return user;
  }

  async authenticateUser(user: LocalUser, res: Response) {
    this.logger.debug(`Authenticating user: ${user.username}`);
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    const jwt = await this.signJwt(payload);
    res.cookie('jwt', jwt, {
      httpOnly: true,
      sameSite: 'strict',
      // secure prevents the cookie to be sent in non https requests, this needs to be disabled in dev
      secure: process.env.NODE_ENV !== 'dev',
    });
    if (!user.private_key_encrypted) {
      res.cookie('noKeysSet', 'true', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'dev',
      });
    } else {
      res.clearCookie('noKeysSet');
    }
    return;
  }
}
