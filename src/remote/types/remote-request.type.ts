import { Request } from 'express';

export interface RemoteRequest extends Request {
  domain?: string;
}
