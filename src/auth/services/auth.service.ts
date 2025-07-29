import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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

  async validateUser(username: string, password: string): Promise<LocalUser> {
    // TODO: implement input validation
    const user: LocalUser = await this.userService.getUserInfo(username);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedException('Invalid username or password');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }
    return user;
  }

  async login(user: LocalUser): Promise<{ access_token: string }> {
    const payload = { username: user.username, sub: user.id };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async registerUser(
    username: string,
    email: string,
    password: string,
  ): Promise<LocalUser> {
    /*if (await this.userService.findByUsername(username)) {
      throw new ConflictException('Username already exists');
    }
    if (await this.userService.findByEmail(email)) {
      throw new ConflictException('Email already exists');
    }*/
    // TODO: implement input validation
    // TODO: check if the username doesn't exist yet
    // TODO: check if the email doesn't exist yet
    // TODO: check if the password is long enough
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.createUser({
      username,
      email,
      passwordHash: hashedPassword,
    });
    return user;
  }
}
