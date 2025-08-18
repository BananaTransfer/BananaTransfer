import { Injectable, Logger } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { ConfigService } from '@nestjs/config';

import { DnsService } from '@remote/services/dns.service';
import { Recipient } from '@user/types/recipient.type';
import { PublicKeyDto } from '@user/dto/publicKey.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RemoteQueryService {
  private readonly envDomain: string;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly dnsService: DnsService,
  ) {
    this.logger = new Logger(RemoteQueryService.name);
    this.envDomain = this.configService.getOrThrow<string>('DOMAIN');
  }

  async getRemoteUserPublicKey(recipient: Recipient): Promise<PublicKeyDto> {
    this.logger.debug(
      `Fetching public key for remote user ${recipient.username} on domain ${recipient.domain}`,
    );
    const serverAddress = await this.dnsService.getServerAddress(
      recipient.domain,
    );
    const url = `http://${serverAddress}/remote/get/publickey/${recipient.username}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-bananatransfer-domain': this.envDomain,
      },
    });

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const data = (await res.json()) as PublicKeyDto;
    const dto = plainToInstance(PublicKeyDto, data);
    await validateOrReject(dto);

    return dto;
  }
}
