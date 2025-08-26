import {
  UseGuards,
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Logger,
} from '@nestjs/common';

import { RemoteGuard } from '@remote/guards/remote.guard';
import { RemoteInboundService } from '@remote/services/remoteInbound.service';
import { UserService } from '@user/services/user.service';

import { RemoteRequest } from '@remote/types/remote-request.type';
import { RemoteTransferDto } from '@remote/dto/remoteTransfer.dto';
import { PublicKeyDto } from '@user/dto/publicKey.dto';
import { ChunkDto } from '@transfer/dto/chunk.dto';
import { TransferInfoDto } from '@remote/dto/transferInfo.dto';

// RemoteController is responsible for handling transfer-related requests from and to other remote servers

@UseGuards(RemoteGuard)
@Controller('remote')
export class RemoteController {
  private readonly logger = new Logger(RemoteController.name);

  constructor(
    private readonly remoteInboundService: RemoteInboundService,
    private readonly userService: UserService,
  ) {}

  // endpoint to get server information
  // this is used to check if the server is reachable
  @Get('server-info')
  getServerInfo(@Req() req: RemoteRequest): string {
    this.logger.debug(`Fetching server info from domain ${req.domain}`);
    return 'hi';
  }

  // endpoint to get the public key of a user
  @Get('publickey/:username')
  async getPublicKey(
    @Req() req: RemoteRequest,
    @Param('username') username: string,
  ): Promise<PublicKeyDto> {
    this.logger.debug(
      `Fetching public key for user ${username} from domain ${req.domain}`,
    );
    return {
      publicKey: (await this.userService.getLocalUser(username)).public_key,
    };
  }

  // endpoint to notify server about a new transfer
  @Post('new/transfer')
  async newTransfer(
    @Req() req: RemoteRequest,
    @Body() remoteTransfer: RemoteTransferDto,
  ): Promise<{ message: string }> {
    this.logger.debug(
      `Received new transfer request from user ${remoteTransfer.senderAddress} from domain ${req.domain}`,
    );
    return await this.remoteInboundService.remoteNewTransfer(
      req.domain,
      remoteTransfer,
    );
  }

  // endpoint to fetch a transfer chunk info
  @Get('fetch/transfer/:id')
  async fetchTransferInfo(
    @Req() req: RemoteRequest,
    @Param('id') id: string,
  ): Promise<TransferInfoDto> {
    this.logger.debug(
      `Fetching transfer info for Transfer ${id} from domain ${req.domain}`,
    );
    return await this.remoteInboundService.remoteFetchTransferInfo(
      req.domain,
      id,
    );
  }

  // endpoint to fetch a transfer chunk by ID
  @Get('fetch/transfer/:id/:chunk')
  async fetchTransferChunk(
    @Req() req: RemoteRequest,
    @Param('id') id: string,
    @Param('chunk') chunk: number,
  ): Promise<ChunkDto> {
    this.logger.debug(
      `Fetching chunk ${chunk} for Transfer ${id} from domain ${req.domain}`,
    );
    return await this.remoteInboundService.remoteFetchTransferChunk(
      req.domain,
      id,
      chunk,
    );
  }

  // endpoint to notify a server that the transfer was retrieved
  @Post('transfer/retrieved/:id')
  async setTransferRetrieved(
    @Req() req: RemoteRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    this.logger.debug(
      `Notifying transfer retrieval for Transfer ${id} from domain ${req.domain}`,
    );
    return await this.remoteInboundService.remoteTransferRetrieved(
      req.domain,
      id,
    );
  }
}
