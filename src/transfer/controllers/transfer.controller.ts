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
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { TransferService } from '@transfer/services/transfer.service';
import { UserService } from '@user/services/user.service';
import { JwtAuthGuard } from '@auth/jwt/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@auth/types/authenticated-request.interface';
import CreateTransferDto from '@transfer/dto/create-transfer.dto';
import ChunkDto from '@transfer/dto/chunk.dto';
import { UserStatusGuard } from '@transfer/guards/userStatus.guard';

// all routes in this controller are protected by the JwtAuthGuard and require authentication
@UseGuards(JwtAuthGuard, UserStatusGuard)
@Controller('transfer')
export class TransferController {
  private readonly envDomain: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly transferService: TransferService,
    private readonly userService: UserService,
  ) {}

  // endpoint to get transfers list page
  @Get('')
  @Render('transfer/list')
  async renderTransfersList(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;

    const transfers = await this.transferService.getTransferList(userId);

    return {
      transfers: transfers,
      currentUser: req.user,
    };
  }

  // endpoint to get new transfer page
  @Get('new')
  renderNewTransfer(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): void {
    res.render('transfer/new', {
      user: req.user,
      csrfToken: req.csrfToken(),
      domain: this.envDomain,
    });
  }

  // endpoint to fetch the data of a transfer by ID
  @Get('/:id')
  async getTransferInfo(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const result = await this.transferService.getTransferInfo(
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
    const userId = req.user.id;
    await this.transferService.uploadChunk(transferId, chunkData, userId);
    res.status(200).send();
  }

  @Get('/:transferId/chunk/:chunkId')
  getChunk(
    @Param('transferId') transferId: string,
    @Param('chunkId') chunkId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<Omit<ChunkDto, 'isLastChunk'>> {
    return this.transferService.getChunk(transferId, chunkId, req.user.id);
  }

  // TODO: TO Delete, only for testing purposes
  @Get('download/:id')
  @Render('transfer/download')
  async renderDownloadPage(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const [transfer] = await this.transferService.getTransferDetails(
        id,
        req.user.id,
      );
      return { transfer };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: message };
    }
  }

  // endpoint to accept a transfer by ID
  @Post('accept/:id')
  acceptTransfer(@Param('id') id: string, @Res() res: Response): void {
    this.transferService.acceptTransfer(id);
    res.redirect('/transfer/list');
  }

  // endpoint to refuse a transfer by ID
  @Post('refuse/:id')
  refuseTransfer(@Param('id') id: string, @Res() res: Response): void {
    this.transferService.refuseTransfer(id);
    res.redirect('/transfer/list');
  }

  // endpoint to delete a transfer by ID
  @Post('delete/:id')
  deleteTransfer(@Param('id') id: string, @Res() res: Response): void {
    this.transferService.deleteTransfer(id);
    res.redirect('/transfer/list');
  }
}
