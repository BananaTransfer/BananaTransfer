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
import { RemoteInboundService } from '@remote/services/remoteInbound.service';
import { RecipientService } from '@user/services/recipient.service';
import { UserService } from '@user/services/user.service';
import { PublicKeyDto } from '@user/dto/publicKey.dto';

// RemoteController is responsible for handling transfer-related requests from and to other remote servers

@UseGuards(RemoteGuard)
@Controller('remote')
export class RemoteController {
  constructor(
    private readonly remoteInboundService: RemoteInboundService,
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
    return {
      publicKey: (await this.userService.getLocalUser(username)).public_key,
    };
  }

  // endpoint to notify server about a new transfer
  @Post('new/transfer')
  notifyTransfer(@Req() req: RemoteRequest, @Body() transferData: any): string {
    return this.remoteInboundService.remoteNewTransfer(
      req.domain,
      transferData,
    );
  }

  // endpoint to accept and fetch transfer data by ID
  @Post('fetch/transfer/:id')
  fetchTransfer(@Req() req: RemoteRequest, @Param('id') id: string): string {
    return this.remoteInboundService.remoteFetchTransfer(req.domain, id);
  }

  // endpoint to refuse a transfer by ID
  @Post('refuse/transfer/:id')
  refuseTransfer(@Req() req: RemoteRequest, @Param('id') id: string): string {
    return this.remoteInboundService.remoteRefuseTransfer(req.domain, id);
  }

  // endpoint to delete a transfer by ID
  @Post('delete/transfer/:id')
  deleteTransfer(@Req() req: RemoteRequest, @Param('id') id: string): string {
    return this.remoteInboundService.remoteDeleteTransfer(req.domain, id);
  }
}
