import { Injectable } from '@nestjs/common';

// Contains business logic and reusable methods. Controllers call services to perform operations (like database queries).

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
