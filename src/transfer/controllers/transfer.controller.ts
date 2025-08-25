import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Render,
  Param,
  Body,
  UseGuards,
  Delete,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { TransferService } from '@transfer/services/transfer.service';
import { RecipientService } from '@user/services/recipient.service';
import { JwtAuthGuard } from '@auth/jwt/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@auth/types/authenticated-request.type';
import { CreateTransferDto } from '@transfer/dto/create-transfer.dto';
import { ChunkDto } from '@transfer/dto/chunk.dto';
import { UserStatusGuard } from '@transfer/guards/userStatus.guard';

// all routes in this controller are protected by the JwtAuthGuard and require authentication
@UseGuards(JwtAuthGuard, UserStatusGuard)
@Controller('transfer')
export class TransferController {
  private readonly logger = new Logger(TransferController.name);
  private readonly envDomain: string;

  constructor(
    private readonly transferService: TransferService,
    private readonly recipientService: RecipientService,
  ) {}

  // endpoint to get transfers list page
  @Get('')
  @Render('transfer/list')
  async renderTransfersList(@Req() req: AuthenticatedRequest) {
    this.logger.debug(`Rendering transfers list for user ${req.user.id}`);
    const transfers = await this.transferService.getTransferListOfUser(
      req.user.id,
    );
    return {
      transfers: transfers,
      currentUser: req.user,
      csrfToken: req.csrfToken(),
    };
  }

  // endpoint to get new transfer page
  @Get('new')
  async renderNewTransfer(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(`Rendering new transfer page for user ${req.user.id}`);
    const knownRecipients = await this.recipientService.getKnownRecipients(
      req.user.id,
    );
    res.render('transfer/new', {
      user: req.user,
      csrfToken: req.csrfToken(),
      domain: this.envDomain,
      knownRecipients,
    });
  }

  // endpoint to fetch the data of a transfer by ID
  @Get('/:id')
  async getTransferInfo(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(`Fetching transfer info for user ${req.user.id}`);
    try {
      const result = await this.transferService.getTransferOfUserDetails(
        id,
        req.user.id,
      );
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(404).json({ error: message });
    }
  }

  // endpoint to add a new transfer
  @Post('/new')
  async newTransfer(
    @Body() transferData: CreateTransferDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(`Creating new transfer for user ${req.user.id}`);
    const userId = req.user.id;
    res.json(await this.transferService.newTransfer(transferData, userId));
  }

  @Post('/:id/chunk')
  async uploadChunk(
    @Param('id') transferId: string,
    @Body() chunkData: ChunkDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.debug(
      `Uploading chunk for transfer ${transferId} for user ${req.user.id}`,
    );
    const userId = req.user.id;
    await this.transferService.uploadChunk(transferId, chunkData, userId);
    res.status(200).send();
  }

  @Get('/:id/chunk/:chunkId')
  getChunk(
    @Param('id') transferId: string,
    @Param('chunkId') chunkId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChunkDto> {
    this.logger.debug(
      `Fetching chunk ${chunkId} for transfer ${transferId} for user ${req.user.id}`,
    );
    return this.transferService.getChunk(transferId, chunkId, req.user.id);
  }

  // endpoint to send a transfer by ID
  @Post('send/:id')
  async sendTransfer(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    this.logger.debug(`Sending transfer ${id} for user ${req.user.id}`);
    await this.transferService.sendTransfer(id, req.user.id);
  }

  // endpoint to accept a transfer by ID
  @Post('accept/:id')
  async acceptTransfer(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    this.logger.debug(`Accepting transfer ${id} for user ${req.user.id}`);
    await this.transferService.acceptTransfer(id, req.user.id);
  }

  // endpoint to refuse a transfer by ID
  @Post('refuse/:id')
  async refuseTransfer(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    this.logger.debug(`Refusing transfer ${id} for user ${req.user.id}`);
    await this.transferService.refuseTransfer(id, req.user.id);
  }

  // endpoint to retrieve a transfer by ID
  @Post('retrieve/:id')
  async retrieveTransfer(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    this.logger.debug(`Retrieving transfer ${id} for user ${req.user.id}`);
    await this.transferService.retrieveTransfer(id, req.user.id);
  }

  // endpoint to delete a transfer by ID
  @Delete('delete/:id')
  async deleteTransfer(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.logger.debug(`Deleting transfer ${id} for user ${req.user.id}`);
    await this.transferService.deleteTransfer(id, req.user.id);
  }
}
