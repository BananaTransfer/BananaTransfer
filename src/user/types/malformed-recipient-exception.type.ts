import { HttpException } from '@nestjs/common';

export class MalformedRecipientException extends HttpException {
  constructor(message: string) {
    super(message, 400);
  }
}
