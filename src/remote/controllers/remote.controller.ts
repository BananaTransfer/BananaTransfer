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
import { RemoteInboundService } from '@remote/services/remoteInbound.service';
import { UserService } from '@user/services/user.service';

import { RemoteRequest } from '@remote/types/remote-request.type';
import { RemoteTransferDto } from '@remote/dto/remoteTransfer.dto';
import { PublicKeyDto } from '@user/dto/publicKey.dto';

// RemoteController is responsible for handling transfer-related requests from and to other remote servers

@UseGuards(RemoteGuard)
@Controller('remote')
export class RemoteController {
  constructor(
    private readonly remoteInboundService: RemoteInboundService,
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
  async notifyTransfer(
    @Req() req: RemoteRequest,
    @Body() remoteTransfer: RemoteTransferDto,
  ): Promise<string> {
    return await this.remoteInboundService.remoteNewTransfer(
      req.domain,
      remoteTransfer,
    );
  }

  // endpoint to accept a transfer by ID
  @Post('accept/transfer/:id')
  async acceptTransfer(
    @Req() req: RemoteRequest,
    @Param('id') id: string,
  ): Promise<string> {
    return await this.remoteInboundService.remoteAcceptTransfer(req.domain, id);
  }

  // endpoint to fetch a transfer chunk by ID
  @Post('fetch/transfer/:id')
  async fetchTransfer(
    @Req() req: RemoteRequest,
    @Param('id') id: string,
  ): Promise<string> {
    return await this.remoteInboundService.remoteFetchTransfer(req.domain, id);
  }

  // endpoint to refuse a transfer by ID
  @Post('refuse/transfer/:id')
  async refuseTransfer(
    @Req() req: RemoteRequest,
    @Param('id') id: string,
  ): Promise<string> {
    return await this.remoteInboundService.remoteRefuseTransfer(req.domain, id);
  }

  // endpoint to delete a transfer by ID
  @Post('delete/transfer/:id')
  async deleteTransfer(
    @Req() req: RemoteRequest,
    @Param('id') id: string,
  ): Promise<string> {
    return await this.remoteInboundService.remoteDeleteTransfer(req.domain, id);
  }
}
