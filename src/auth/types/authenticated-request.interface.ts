import { CsrfRequest } from './csrf-request.interface';
import { UserPayload } from './user-payload.interface';

export interface AuthenticatedRequest extends CsrfRequest {
  user: UserPayload;
}
