import { HttpException } from '@nestjs/common';

export class InvalidDomainException extends HttpException {
  constructor(message: string) {
    super(message, 400);
  }
}
