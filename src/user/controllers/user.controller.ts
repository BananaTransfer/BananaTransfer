import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { Response } from 'express';

import { UserService } from '@user/services/user.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@auth/types/authenticated-request.interface';

// all routes in this controller are protected by the JwtAuthGuard and require authentication
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // endpoint to get user settings page
  @Get('')
  renderUserSettings(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): void {
    const user = this.userService.findByUserId(req.user.id);
    res.render('user/settings', { user });
  }

  // endpoint to get page to create/update private key
  @Get('set-keys')
  renderSetKeysPage(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): void {
    res.render('user/set-keys', { user: req.user });
  }

  @Get('change-password')
  renderChangePasswordPage(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): void {
    res.render('user/change-password', { user: req.user });
  }

  // endpoint to get encrypted private key from user in the frontend
  @Get('get/privatekey')
  async getPrivateKey(@Req() req: AuthenticatedRequest) {
    const privateKey = await this.userService.getUserPrivateKey(req.user.id);
    return { privateKey };
  }

  // endpoint to get public key of local or remote user
  @Get('get/publickey/:username')
  getPublicKey(@Param('username') username: string): string {
    return this.userService.getPublicKey(username);
  }

  @Post('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const user = await this.userService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
      );
      if (user) {
        res.redirect('/user/settings');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).send('Error changing password');
    }
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
