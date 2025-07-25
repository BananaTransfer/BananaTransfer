import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { UserService } from '../user/user.service';

describe('TransferController', () => {
  let transferController: TransferController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [TransferController],
      providers: [TransferService, UserService],
    }).compile();

    transferController = module.get<TransferController>(TransferController);
  });

  describe('transferController', () => {
    it('controller should be defined', () => {
      expect(transferController).toBeDefined();
    });
  });

  describe('transferService', () => {
    it('service should be defined', () => {
      const transferService = transferController['transferService'];
      expect(transferService).toBeDefined();
    });
  });

  describe('userService', () => {
    it('service should be defined', () => {
      const userService = transferController['userService'];
      expect(userService).toBeDefined();
    });
  });

  // TODO: Add tests for endpoints/methods
});
