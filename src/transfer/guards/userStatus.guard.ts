import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthenticatedRequest } from '@auth/types/authenticated-request.type';
@Injectable()
export class UserStatusGuard implements CanActivate {
  private readonly logger = new Logger(UserStatusGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    if (request.cookies.noKeysSet) {
      this.logger.log(
        `User ${request.user.username} (${request.user.id}) has not set up their keys yet. redirect to /user/set-keys`,
      );
      response.redirect('/user/set-keys');
      return false;
    }

    return true;
  }
}
