import { Injectable } from '@nestjs/common';

@Injectable()
export class TransferService {
  getTransferData(): string {
    return 'Transfer data';
  }
}
