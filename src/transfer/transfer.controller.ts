import {
  Controller,
  Get,
  Post,
  Res,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import { TransferService } from './transfer.service';
import { UserService } from '../user/user.service';
import { LocalAuthGuard } from '../auth/local-auth.guard';

// all routes in this controller are protected by the LocalAuthGuard and require authentication
@UseGuards(LocalAuthGuard)
@Controller('transfer')
export class TransferController {
  constructor(
    private readonly transferService: TransferService,
    private readonly userService: UserService,
  ) {}

  // endpoint to get transfers list page
  @Get('')
  renderTransfersList(@Res() res: Response): void {
    const transfers = this.transferService.getTransferList();
    res.render('list', { transfers });
  }

  // endpoint to get new transfer page
  @Get('new')
  renderNewTransfer(@Res() res: Response): void {
    const knownRecipients = this.userService.getKnownRecipients();
    res.render('new', { knownRecipients });
  }

  // endpoint to fetch the data of a transfer by ID
  @Get('fetch/:id')
  fetchTransfer(@Param('id') id: string, @Res() res: Response): void {
    const result = this.transferService.fetchTransfer(id);
    res.download(result);
  }

  // endpoint to add a new transfer
  @Post('new')
  newTransfer(@Body() transferData: any, @Res() res: Response): void {
    this.transferService.newTransfer(transferData);
    res.redirect('/transfer/list');
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
