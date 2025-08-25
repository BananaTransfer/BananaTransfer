import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PasswordService } from '@user/services/password.service';
import { UserStatus } from '@database/entities/enums';
import { LocalUser } from '@database/entities/local-user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly passwordService: PasswordService,
    @InjectRepository(LocalUser)
    private localUserRepository: Repository<LocalUser>,
  ) {}

  async findByUserId(userId: number): Promise<LocalUser | null> {
    return await this.localUserRepository.findOneBy({ id: userId });
  }

  async findByUsername(username: string): Promise<LocalUser | null> {
    return await this.localUserRepository.findOneBy({ username });
  }

  async findByEmail(email: string): Promise<LocalUser | null> {
    return await this.localUserRepository.findOneBy({ email });
  }

  async getCurrentUser(userId: number): Promise<LocalUser> {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getLocalUser(username: string): Promise<LocalUser> {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('Local user not found');
    }
    return user;
  }

  async createUser(
    username: string,
    email: string,
    password: string,
  ): Promise<LocalUser> {
    if (await this.findByUsername(username)) {
      throw new ConflictException('Username already exists');
    }
    if (await this.findByEmail(email)) {
      throw new ConflictException('Email already exists');
    }
    const password_hash = await this.passwordService.hashPassword(password);
    const user = this.localUserRepository.create({
      username,
      email,
      password_hash,
      status: UserStatus.ACTIVE,
    });
    return await this.localUserRepository.save(user);
  }

  async setLastLogin(userId: number): Promise<void> {
    await this.localUserRepository.update(
      { id: userId },
      { last_login: new Date() },
    );
  }

  async changeUserPassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<LocalUser | null> {
    const user = await this.getCurrentUser(userId);
    if (!(await this.passwordService.validatePassword(user, currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.password_hash = await this.passwordService.hashPassword(newPassword);
    user.password_created_at = new Date();
    return await this.localUserRepository.save(user);
  }

  async setUserKeys(
    userId: number,
    password: string,
    publicKey: string,
    privateKeyEncrypted: string,
    privateKeySalt: string,
    privateKeyIv: string,
  ): Promise<LocalUser> {
    const user = await this.getCurrentUser(userId);
    if (!(await this.passwordService.validatePassword(user, password))) {
      throw new UnauthorizedException('Invalid password');
    }

    user.private_key_encrypted = privateKeyEncrypted;
    user.private_key_salt = privateKeySalt;
    user.private_key_iv = privateKeyIv;
    user.public_key = publicKey;
    user.key_created_at = new Date();
    return await this.localUserRepository.save(user);
  }
}
