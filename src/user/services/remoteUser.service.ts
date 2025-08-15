import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoteUser } from '@database/entities/remote-user.entity';

@Injectable()
export class RemoteUserService {
  constructor(
    @InjectRepository(RemoteUser)
    private remoteUserRepository: Repository<RemoteUser>,
  ) {}

  async getRemoteUser(username: string, domain: string): Promise<RemoteUser> {
    const user = await this.remoteUserRepository.findOneBy({
      username,
      domain,
    });
    if (!user) {
      throw new NotFoundException('Remote user not found');
    }
    return user;
  }

  async createRemoteUser(
    username: string,
    domain: string,
  ): Promise<RemoteUser> {
    if (await this.remoteUserRepository.findOneBy({ username, domain })) {
      throw new ConflictException('Remote user already exists');
    }
    const user = this.remoteUserRepository.create({
      username,
      domain,
    });
    return await this.remoteUserRepository.save(user);
  }
}
