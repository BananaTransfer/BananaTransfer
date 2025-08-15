import { Controller, Get, Post, Param, Body } from '@nestjs/common';

import { TransferService } from '@transfer/services/transfer.service';
import { RecipientService } from '@user/services/recipient.service';
import { GetPubKeyDto } from '@user/dto/getPubKey.dto';

// RemoteController is responsible for handling transfer-related requests from other remote servers

// TODO: create middleware that checks each request from other servers: check DNS of domain and the servers TLS certificate

@Controller('remote')
export class RemoteController {
  constructor(
    private readonly transferService: TransferService,
    private readonly recipientService: RecipientService,
  ) {}

  // endpoint to get server information
  // this is used to check if the server is reachable
  @Get('get/server-info')
  getServerInfo(): string {
    return 'hi';
  }

  // endpoint to get the public key of a user
  @Get('get/publickey/:username')
  getPublicKey(@Param('username') username: string): Promise<GetPubKeyDto> {
    return this.recipientService.getPublicKey(username);
  }

  // endpoint to notify server about a new transfer
  @Post('new/transfer')
  notifyTransfer(@Body() transferData: any): string {
    return this.transferService.remoteNewTransfer(transferData);
  }

  // endpoint to accept and retrieve transfer data by ID
  @Post('fetch/transfer/:id')
  fetchTransfer(@Param('id') id: number): string {
    return this.transferService.remoteFetchTransfer(id);
  }

  // endpoint to refuse a transfer by ID
  @Post('refuse/transfer/:id')
  refuseTransfer(@Param('id') id: number): string {
    return this.transferService.remoteRefuseTransfer(id);
  }

  // endpoint to delete a transfer by ID
  @Post('delete/transfer/:id')
  deleteTransfer(@Param('id') id: number): string {
    return this.transferService.remoteDeleteTransfer(id);
  }
}
