import { Test, TestingModule } from '@nestjs/testing';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

describe('ServiceController', () => {
  let serviceController: ServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [ServiceService],
    }).compile();

    serviceController = module.get<ServiceController>(ServiceController);
  });

  describe('serviceController', () => {
    it('controller should be defined', () => {
      expect(serviceController).toBeDefined();
    });
  });

  // TODO: Add tests for endpoints/methods
});
