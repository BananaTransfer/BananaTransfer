import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiceService {
  getServiceData(): string {
    return 'Service data';
  }
}
