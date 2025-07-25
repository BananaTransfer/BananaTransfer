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
import { UserService } from './user.service';
import { LocalAuthGuard } from '../auth/local-auth.guard';

// all routes in this controller are protected by the LocalAuthGuard and require authentication
@UseGuards(LocalAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // endpoint to get settings page
  @Get('settings')
  renderSettings(@Res() res: Response): void {
    const user = this.userService.getUserInfo();
    res.render('settings', { user });
  }

  // endpoint to get page to create/update private key
  @Get('create-keys')
  renderUserKeysPage(@Res() res: Response): void {
    const user = this.userService.getUserInfo();
    res.render('create-keys', { user });
  }

  // endpoint to get encrypted private key from user in the frontend
  @Get('get/privatekey')
  getPrivateKey() {
    return this.userService.getPrivateKey();
  }

  // endpoint to update private and public key of user
  @Post('set/user-keys')
  setUserKeys(
    @Body('privateKey') privateKey: string,
    @Body('publicKey') publicKey: string,
    @Res() res: Response,
  ): void {
    this.userService.setUserKeys(privateKey, publicKey);
    res.redirect('/user/settings');
  }

  // endpoint to get public key of local or remote user
  @Get('get/publickey/:username')
  getPublicKey(@Param('username') username: string): string {
    return this.userService.getPublicKey(username);
  }

  // endpoint to trust and save the public key of another user as known for this user
  @Post('trust/publickey')
  trustPublicKey(
    @Body('username') username: string,
    @Body('recipient') recipient: string,
    @Body('publickey') publicKey: string,
  ): void {
    this.userService.trustPublicKey(username, recipient, publicKey);
  }
}
