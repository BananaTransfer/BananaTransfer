import {
  UseGuards,
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
} from '@nestjs/common';

import { RemoteGuard } from '@remote/guards/remote.guard';
import { RemoteRequest } from '@remote/types/remote-request.type';
import { RemoteService } from '@remote/services/remote.service';
import { RecipientService } from '@user/services/recipient.service';
import { UserService } from '@user/services/user.service';
import { PublicKeyDto } from '@user/dto/public-key.dto';

// RemoteController is responsible for handling transfer-related requests from and to other remote servers

@UseGuards(RemoteGuard)
@Controller('remote')
export class RemoteController {
  constructor(
    private readonly remoteService: RemoteService,
    private readonly recipientService: RecipientService,
    private readonly userService: UserService,
  ) {}

  // endpoint to get server information
  // this is used to check if the server is reachable
  @Get('get/server-info')
  getServerInfo(): string {
    return 'hi';
  }

  // endpoint to get the public key of a user
  @Get('get/publickey/:username')
  async getPublicKey(
    @Param('username') username: string,
  ): Promise<PublicKeyDto> {
    return await this.userService.getLocalUserPublicKey(username);
  }

  // endpoint to notify server about a new transfer
  @Post('new/transfer')
  notifyTransfer(@Req() req: RemoteRequest, @Body() transferData: any): string {
    console.log(req.domain);
    return this.remoteService.remoteNewTransfer(transferData);
  }

  // endpoint to accept and retrieve transfer data by ID
  @Post('fetch/transfer/:id')
  fetchTransfer(@Param('id') id: number): string {
    return this.remoteService.remoteFetchTransfer(id);
  }

  // endpoint to refuse a transfer by ID
  @Post('refuse/transfer/:id')
  refuseTransfer(@Param('id') id: number): string {
    return this.remoteService.remoteRefuseTransfer(id);
  }

  // endpoint to delete a transfer by ID
  @Post('delete/transfer/:id')
  deleteTransfer(@Param('id') id: number): string {
    return this.remoteService.remoteDeleteTransfer(id);
  }
}
