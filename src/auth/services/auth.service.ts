import {
  Injectable,
  Inject,
  forwardRef,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserPayload } from '@auth/types/user-payload.interface';
import { UserService } from '@user/services/user.service';
import { UserStatus } from '@database/entities/enums';
import { LocalUser } from '@database/entities/local-user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async verifyJwt(token: string): Promise<UserPayload> {
    return this.jwtService.verifyAsync<UserPayload>(token);
  }

  async validateUser(username: string, password: string): Promise<LocalUser> {
    const user = await this.userService.findByUsername(username);
    if (!user || !(await this.validateUserPassword(user, password))) {
      throw new UnauthorizedException('Invalid username or password');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }
    return user;
  }

  async validateUserPassword(
    user: LocalUser,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async registerUser(
    username: string,
    email: string,
    password: string,
  ): Promise<LocalUser> {
    const password_hash = await this.hashPassword(password);
    const user = await this.userService.createUser(
      username,
      email,
      password_hash,
    );
    return user;
  }

  async authenticateUser(user: LocalUser, res: Response) {
    const payload = { id: user.id, username: user.username, email: user.email };
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
