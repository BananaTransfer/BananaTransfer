import { Injectable, Logger } from '@nestjs/common';
import { DnsService } from '@remote/services/dns.service';

@Injectable()
export class RemoteService {
  private readonly logger: Logger;

  constructor(private readonly dnsService: DnsService) {
    this.logger = new Logger(RemoteService.name);
  }
}
