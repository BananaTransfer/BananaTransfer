import { Injectable } from '@nestjs/common';

@Injectable()
export class RemoteService {
  getServerInfo(): string {
    return 'BananaTransfer Remote Server';
  }
}
