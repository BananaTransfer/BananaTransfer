import {
  Controller,
  Get,
  Post,
  // Req,
  Res,
  Render,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { TransferService } from '@transfer/services/transfer.service';
import { UserService } from '@user/services/user.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

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
  renderTransfersList(/*@Req() req: Request, @Res() res: Response*/): void {
    // const transfers = this.transferService.getTransferList(req.user.id;
    // return { transfers };
    return;
  }

  // endpoint to get new transfer page
  @Get('new')
  @Render('transfer/new')
  renderNewTransfer(/*@Req() req: Request, @Res() res: Response*/): void {
    // const knownRecipients = this.userService.getKnownRecipients(req.user.id);
    //res.render('new', { knownRecipients });
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
  newTransfer(@Body() transferData: any, @Res() res: Response): void {
    this.transferService.newTransfer(transferData);
    res.redirect('/transfer/list');
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
