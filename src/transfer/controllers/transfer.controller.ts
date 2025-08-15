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
  NotImplementedException,
} from '@nestjs/common';
import { Response } from 'express';

import { TransferStatus } from '@database/entities/enums';
import { TransferService } from '@transfer/services/transfer.service';
import { UserService } from '@user/services/user.service';
import { JwtAuthGuard } from '@auth/jwt/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@auth/types/authenticated-request.interface';
import CreateTransferDto from '@transfer/dto/create-transfer.dto';
import ChunkDto from '@transfer/dto/chunk.dto';

// all routes in this controller are protected by the JwtAuthGuard and require authentication
@UseGuards(JwtAuthGuard)
@Controller('transfer')
export class TransferController {
  constructor(
    private readonly transferService: TransferService,
    private readonly userService: UserService,
  ) {}

  // endpoint to get transfers list page
  @Get('')
  @Render('transfer/list')
  renderTransfersList(/*@Req() req: Request, @Res() res: Response*/) {
    // const transfers = this.transferService.getTransferList(req.user.id;
    // return { transfers };
    return {
      transfers: [
        {
          id: 54,
          status: TransferStatus.RETRIEVED,
          created_at: new Date(),
          filename: 'test.txt',
          subject: 'asdfasdfasdf',
          recipient: 'user@example.com',
          sender: 'sender@example.com',
        },
      ],
    };
  }

  // endpoint to get new transfer page
  @Get('new')
  renderNewTransfer(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): void {
    const domain = this.userService.getDomain();
    res.render('transfer/new', {
      user: req.user,
      csrfToken: req.csrfToken(),
      domain: domain,
    });
  }

  // endpoint to fetch the data of a transfer by ID
  @Get('/:id')
  async getTransferInfo(
    @Param('id') id: number,
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
    @Param('id') transferId: number,
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
    @Param('transferId') transferId: number,
    @Param('chunkId') chunkId: number,
  ): Promise<ChunkDto> {
    throw new NotImplementedException(transferId + chunkId);
  }

  // TODO: TO Delete, only for testing purposes
  @Get('download/:id')
  @Render('transfer/download')
  async renderDownloadPage(
    @Param('id') id: number,
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
  acceptTransfer(@Param('id') id: number, @Res() res: Response): void {
    this.transferService.acceptTransfer(id);
    res.redirect('/transfer/list');
  }

  // endpoint to refuse a transfer by ID
  @Post('refuse/:id')
  refuseTransfer(@Param('id') id: number, @Res() res: Response): void {
    this.transferService.refuseTransfer(id);
    res.redirect('/transfer/list');
  }

  // endpoint to delete a transfer by ID
  @Post('delete/:id')
  deleteTransfer(@Param('id') id: number, @Res() res: Response): void {
    this.transferService.deleteTransfer(id);
    res.redirect('/transfer/list');
  }
}
