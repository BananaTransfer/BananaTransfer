import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { UserPayload } from '@auth/types/user-payload.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.jwt;
    if (!token) {
      this.logger.debug('No JWT token found, redirect to login');
      res.redirect('/auth/login');
      return false;
    }

    try {
      req.user = await this.jwtService.verifyAsync<UserPayload>(token);
      return true;
    } catch (err) {
      this.logger.warn('JWT verification failed, redirect to login', err);
      res.redirect('/auth/login');
      return false;
    }
  }
}
