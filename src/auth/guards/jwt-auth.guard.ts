import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '@auth/interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.jwt;
    if (!token) throw new UnauthorizedException('No JWT cookie found');

    try {
      req.user = await this.jwtService.verifyAsync<JwtPayload>(token);
      return true;
    } catch (err) {
      console.error('JWT verification failed:', err);
      throw new UnauthorizedException('Invalid or expired JWT');
    }
  }
}
