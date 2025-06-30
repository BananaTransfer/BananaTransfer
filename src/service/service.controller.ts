import { Controller, Get } from '@nestjs/common';
import { ServiceService } from './service.service';

@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  // example endpoint to get service data
  @Get('get')
  getService(): string {
    return this.serviceService.getServiceData();
  }
}
