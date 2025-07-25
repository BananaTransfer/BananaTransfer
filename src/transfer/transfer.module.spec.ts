import { Test, TestingModule } from '@nestjs/testing';
import { TransferModule } from './transfer.module';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { ConfigModule } from '@nestjs/config';

describe('TransferModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TransferModule, ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
  });

  describe('TransferModule', () => {
    it('module should be defined', () => {
      expect(module).toBeDefined();
    });
  });

  describe('TransferController', () => {
    it('should be defined', () => {
      const transferController =
        module.get<TransferController>(TransferController);
      expect(transferController).toBeDefined();
    });
  });

  describe('TransferService', () => {
    it('should be defined', () => {
      const transferService = module.get<TransferService>(TransferService);
      expect(transferService).toBeDefined();
    });
  });
});
