import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';

describe('TransferController', () => {
  let transferController: TransferController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [TransferController],
      providers: [TransferService],
    }).compile();

    transferController = module.get<TransferController>(TransferController);
  });

  describe('transferController', () => {
    it('controller should be defined', () => {
      expect(transferController).toBeDefined();
    });
  });

  // TODO: Add tests for endpoints/methods
});
