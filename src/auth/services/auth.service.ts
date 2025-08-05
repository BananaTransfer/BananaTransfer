import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { JwtPayload } from '@auth/interfaces/jwt-payload.interface';
import { UserService } from '@user/services/user.service';
import { UserStatus } from '@database/entities/enums';
import { LocalUser } from '@database/entities/local-user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async verifyJwt(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }

  async validateUser(username: string, password: string): Promise<LocalUser> {
    const user: LocalUser = await this.userService.getUserInfo(username);
    if (!(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedException('Invalid username or password');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }
    return user;
  }

  async registerUser(
    username: string,
    email: string,
    password: string,
  ): Promise<LocalUser> {
    if (await this.userService.findByUsername(username)) {
      throw new ConflictException('Username already exists');
    }
    if (await this.userService.findByEmail(email)) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.createUser({
      username,
      email,
      password_hash: hashedPassword,
      status: UserStatus.ACTIVE,
    });
    return user;
  }

  async authenticateUser(user: LocalUser, res: Response) {
    const payload = { username: user.username, sub: user.id };
    const jwt = await this.jwtService.signAsync(payload);
    res.cookie('jwt', jwt, {
      httpOnly: true,
      sameSite: 'strict',
      // secure prevents the cookie to be sent in non https requests, this needs to be disabled in dev
      secure: process.env.NODE_ENV !== 'dev',
    });
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
