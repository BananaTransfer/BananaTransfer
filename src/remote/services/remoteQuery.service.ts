import { Injectable, Logger } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { ClassConstructor, plainToInstance } from 'class-transformer';

import { DnsService } from '@remote/services/dns.service';
import { Recipient } from '@user/types/recipient.type';
import { PublicKeyDto } from '@user/dto/publicKey.dto';

@Injectable()
export class RemoteQueryService {
  private readonly envDomain: string;
  private readonly nodeEnv?: string;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly dnsService: DnsService,
  ) {
    this.logger = new Logger(RemoteQueryService.name);
    this.envDomain = this.configService.getOrThrow<string>('DOMAIN');
    this.nodeEnv = this.configService.get<string>('NODE_ENV');
  }

  private async callRemoteApi<R, T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    domain: string,
    path: string,
    body?: R,
  ): Promise<T> {
    const protocol = this.nodeEnv === 'dev' ? 'http' : 'https';
    const serverAddress = await this.dnsService.getServerAddress(domain);
    const url = `${protocol}://${serverAddress}/${path}`;

    const request = {
      method: method,
      headers: { 'x-bananatransfer-domain': this.envDomain },
    };

    if (body) {
      request['body'] = JSON.stringify({ body });
      request.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, request);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }

  async getRemoteUserPublicKey(recipient: Recipient): Promise<PublicKeyDto> {
    this.logger.debug(
      `Fetching public key for remote user ${recipient.username} on domain ${recipient.domain}`,
    );

    const data = await this.callRemoteApi<PublicKeyDto, PublicKeyDto>(
      'GET',
      recipient.domain,
      `remote/get/publickey/${recipient.username}`,
    );

    const dto = plainToInstance(PublicKeyDto, data);
    await validateOrReject(dto);
    return dto;
  }
}
