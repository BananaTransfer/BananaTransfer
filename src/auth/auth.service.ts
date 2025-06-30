import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  async validateUser(username: string, password: string): Promise<any> {
    // Replace with your user lookup logic
    const user = {
      username: 'test',
      passwordHash: await bcrypt.hash('testpass', 10),
    };
    if (
      user &&
      user.username === username &&
      (await bcrypt.compare(password, user.passwordHash))
    ) {
      return { username: user.username };
    }
    return null;
  }
}
