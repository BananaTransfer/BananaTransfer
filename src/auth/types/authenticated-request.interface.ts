import { Request } from 'express';
import { UserPayload } from './user-payload.interface';

export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}
