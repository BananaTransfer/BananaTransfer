import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { JwtPayload } from '@auth/interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.jwt;
    if (!token) {
      res.redirect('/auth/login');
      return false;
    }

    try {
      req.user = await this.jwtService.verifyAsync<JwtPayload>(token);
      return true;
    } catch (err) {
      console.error('JWT verification failed:', err);
      res.redirect('/auth/login');
      return false;
    }
  }
}
