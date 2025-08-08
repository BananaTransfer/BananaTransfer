import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { LocalUser } from '@database/entities/local-user.entity';

@Injectable()
export class PasswordService {
  constructor() {}

  public async validatePassword(
    user: LocalUser,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
