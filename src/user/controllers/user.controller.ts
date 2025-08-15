import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Query,
  Param,
  Body,
  UseGuards,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';

import { UserService } from '@user/services/user.service';
import { JwtAuthGuard } from '@auth/jwt/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@auth/types/authenticated-request.interface';
import { ChangePasswordDto } from '@user/dto/changePassword.dto';
import { SetKeysDto } from '@user/dto/setKeys.dto';

// all routes in this controller are protected by the JwtAuthGuard and require authentication
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  private async renderUserSettingsPage(
    req: AuthenticatedRequest,
    res: Response,
    options: {
      username?: string;
      error?: string;
      setKeysSuccess?: boolean;
      changePasswordSuccess?: boolean;
    } = {},
  ): Promise<void> {
    const user = await this.userService.findByUserId(req.user.id);
    res.render('user/settings', { user, ...options });
  }

  private renderChangePasswordPage(
    req: AuthenticatedRequest,
    res: Response,
    options: { error?: string } = {},
  ): void {
    res.render('user/change-password', {
      user: req.user,
      csrfToken: req.csrfToken(),
      ...options,
    });
  }

  private async renderSetKeysPage(
    req: AuthenticatedRequest,
    res: Response,
    options: { error?: string } = {},
  ): Promise<void> {
    const user = await this.userService.findByUserId(req.user.id);
    res.render('user/set-keys', {
      user,
      csrfToken: req.csrfToken(),
      ...options,
    });
  }

  // endpoint to get user settings page
  @Get('')
  async getUserSettingsPage(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query()
    query: {
      setKeysSuccess?: boolean;
      changePasswordSuccess?: boolean;
    },
  ): Promise<void> {
    await this.renderUserSettingsPage(req, res, query);
  }

  // endpoint to get page to change password
  @Get('change-password')
  getChangePasswordPage(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): void {
    this.renderChangePasswordPage(req, res);
  }

  // endpoint to get page to create/update private key
  @Get('set-keys')
  async getSetKeysPage(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.renderSetKeysPage(req, res);
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

  // endpoint to change password of user
  @Post('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    try {
      const user = await this.userService.changeUserPassword(
        req.user.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );
      if (!user) {
        throw new Error('Failed to change password');
      }
      this.logger.log(`Password changed for user ${user.username}`);
      res.redirect('/user?changePasswordSuccess=true');
    } catch (error) {
      this.logger.error('Error changing password', error);
      this.renderChangePasswordPage(req, res, {
        error:
          (error as { message: string }).message || 'Failed to change password',
      });
    }
  }

  // endpoint to update private and public key of user
  @Post('set-keys')
  async setUserKeys(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Body() setKeysDto: SetKeysDto,
  ) {
    try {
      const user = await this.userService.setUserKeys(
        req.user.id,
        setKeysDto.password,
        setKeysDto.publicKey,
        setKeysDto.privateKeyEncrypted,
        setKeysDto.privateKeySalt,
        setKeysDto.privateKeyIv,
      );
      if (!user) {
        throw new Error('Failed to set user keys');
      }
      this.logger.log(`Keys set for user ${user.username}`);
      return res.json({
        redirect: '/user?setKeysSuccess=true',
      });
    } catch (error) {
      this.logger.error('Error setting user keys', error);
      throw new InternalServerErrorException('Failed to set keys');
    }
  }

  // endpoint to trust and save the public key of another user as known for this user
  /*@Post('trust/publickey')
  trustPublicKey(
    @Body('username') username: string,
    @Body('recipient') recipient: string,
    @Body('publickey') publicKey: string,
  ): void {
    this.userService.trustPublicKey(username, recipient, publicKey);
  }*/
}
