import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

import { UserPayload } from '@auth/types/user-payload.interface';
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
    return this.jwtService.verifyAsync<UserPayload>(token);
  }

  private async signJwt(payload: UserPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async validateUser(username: string, password: string): Promise<LocalUser> {
    const user = await this.userService.findByUsername(username);
    if (
      !user ||
      !(await this.passwordService.validatePassword(user, password))
    ) {
      throw new UnauthorizedException('Invalid username or password');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }
    return user;
  }

  async authenticateUser(user: LocalUser, res: Response) {
    const payload = { id: user.id, username: user.username, email: user.email };
    const jwt = await this.signJwt(payload);
    res.cookie('jwt', jwt, {
      httpOnly: true,
      sameSite: 'strict',
      // secure prevents the cookie to be sent in non https requests, this needs to be disabled in dev
      secure: process.env.NODE_ENV !== 'dev',
    });
    return;
  }
}
