import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoteUser } from '@database/entities/remote-user.entity';

@Injectable()
export class RemoteUserService {
  private readonly logger = new Logger(RemoteUserService.name);

  constructor(
    @InjectRepository(RemoteUser)
    private remoteUserRepository: Repository<RemoteUser>,
  ) {}

  async getRemoteUser(
    username: string,
    domain: string,
  ): Promise<RemoteUser | null> {
    return await this.remoteUserRepository.findOneBy({
      username,
      domain,
    });
  }

  async getOrCreateRemoteUser(
    username: string,
    domain: string,
  ): Promise<RemoteUser> {
    this.logger.debug(`Getting or creating remote user ${username}@${domain}`);
    let user = await this.getRemoteUser(username, domain);
    if (!user) {
      user = await this.createRemoteUser(username, domain);
    }
    return user;
  }

  private async createRemoteUser(
    username: string,
    domain: string,
  ): Promise<RemoteUser> {
    this.logger.log(`Creating remote user ${username}@${domain}`);
    const user = this.remoteUserRepository.create({
      username,
      domain,
    });
    return await this.remoteUserRepository.save(user);
  }
}
