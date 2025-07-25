import { Test, TestingModule } from '@nestjs/testing';
import { RemoteModule } from './remote.module';
import { RemoteController } from './remote.controller';
import { RemoteService } from './remote.service';
import { TransferService } from '../transfer/transfer.service';
import { UserService } from '../user/user.service';
import { ConfigModule } from '@nestjs/config';

describe('RemoteModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), RemoteModule],
    }).compile();
  });

  describe('RemoteModule', () => {
    it('module should be defined', () => {
      expect(module).toBeDefined();
    });
  });

  describe('RemoteController', () => {
    it('should be defined', () => {
      const remoteController = module.get<RemoteController>(RemoteController);
      expect(remoteController).toBeDefined();
    });
  });

  describe('RemoteService', () => {
    it('should be defined', () => {
      const remoteService = module.get<RemoteService>(RemoteService);
      expect(remoteService).toBeDefined();
    });
  });

  describe('TransferService', () => {
    it('should be defined', () => {
      const transferService = module.get<TransferService>(TransferService);
      expect(transferService).toBeDefined();
    });
  });

  describe('UserService', () => {
    it('should be defined', () => {
      const userService = module.get<UserService>(UserService);
      expect(userService).toBeDefined();
    });
  });
});
