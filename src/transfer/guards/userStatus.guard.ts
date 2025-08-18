import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserService } from '@user/services/user.service';
import { AuthenticatedRequest } from '@auth/types/authenticated-request.interface';
import { Response } from 'express';

@Injectable()
export class UserStatusGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const userId = request.user.id;
    const user = await this.userService.getCurrentUser(userId);

    if (!user.private_key_encrypted) {
      response.redirect('/user/set-keys');
      return false;
    }

    return true;
  }
}
