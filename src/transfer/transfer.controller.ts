import { Controller, Get } from '@nestjs/common';
import { TransferService } from './transfer.service';

@Controller('transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  // example endpoint to get service data
  @Get('get')
  getTransfer(): string {
    return this.transferService.getTransferData();
  }
}
