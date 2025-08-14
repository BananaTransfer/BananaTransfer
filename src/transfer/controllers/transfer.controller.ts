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

import { TransferStatus } from '@database/entities/enums';
import { TransferService } from '@transfer/services/transfer.service';
import { UserService } from '@user/services/user.service';
import { JwtAuthGuard } from '@auth/jwt/guards/jwt-auth.guard';
import { ChunkedTransferDto } from '@transfer/dto/chunked-transfer.dto';
import { AuthenticatedRequest } from '@auth/types/authenticated-request.interface';

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
    const domain = process.env.DOMAIN || 'localhost:3000';
    res.render('transfer/new', {
      user: req.user,
      csrfToken: req.csrfToken(),
      domain: domain,
    });
  }

  // endpoint to fetch the data of a transfer by ID
  @Get('fetch/:id')
  fetchTransfer(/*
    @Param('id') id: number,
    @Req() req: Request,
    @Res() res: Response,
  */): void {
    // const result = this.transferService.fetchTransfer(id, req.user.id);
    // res.download(result);
  }

  // endpoint to add a new transfer
  @Post('new')
  async newTransfer(
    @Body() transferData: ChunkedTransferDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user.id;

    // Handle chunked upload with JSON data
    if (transferData.chunkData && transferData.chunkIndex !== undefined) {
      // Decode base64 chunk data
      const chunkBuffer = Buffer.from(transferData.chunkData, 'base64');

      const chunkData = {
        chunkData: chunkBuffer,
        chunkIndex: transferData.chunkIndex,
        isLastChunk: transferData.isLastChunk ?? false,
        iv: transferData.iv ?? '',
      };

      // If this is the first chunk, include transfer metadata
      const transferRequest = transferData.filename
        ? {
            filename: transferData.filename,
            subject: transferData.subject ?? '',
            recipientUsername: transferData.recipientUsername ?? '',
            symmetricKeyEncrypted: transferData.symmetricKeyEncrypted ?? '',
            signatureSender: transferData.signatureSender ?? '',
            totalFileSize: transferData.totalFileSize ?? 0,
            totalChunks: transferData.totalChunks ?? 0,
            chunkSize: transferData.chunkSize ?? 0,
          }
        : null;

      await this.transferService.handleChunkUpload(
        chunkData,
        transferRequest,
        userId,
      );
      res.json({ success: true, message: 'Chunk uploaded successfully' });
    } else {
      // Handle single file upload
      const fileBuffer = transferData.fileContent
        ? Buffer.from(transferData.fileContent, 'base64')
        : undefined;

      const transferRequest = {
        filename: transferData.filename ?? '',
        subject: transferData.subject ?? '',
        recipientUsername: transferData.recipientUsername ?? '',
        symmetricKeyEncrypted: transferData.symmetricKeyEncrypted ?? '',
        signatureSender: transferData.signatureSender ?? '',
        fileContent: fileBuffer,
        totalFileSize: fileBuffer?.length,
      };

      await this.transferService.newTransfer(transferRequest, userId);
      res.redirect('/transfer');
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
