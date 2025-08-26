import { CsrfRequest } from './csrf-request.type';
import { UserPayload } from './user-payload.type';

export interface AuthenticatedRequest extends CsrfRequest {
  user: UserPayload;
}
