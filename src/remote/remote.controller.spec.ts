import { Test, TestingModule } from '@nestjs/testing';
import { RemoteController } from './remote.controller';
import { RemoteService } from './remote.service';
import { TransferService } from '../transfer/transfer.service';
import { UserService } from '../user/user.service';
import { ConfigModule } from '@nestjs/config';

describe('RemoteController', () => {
  let remoteController: RemoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [RemoteController],
      providers: [RemoteService, TransferService, UserService],
    }).compile();

    remoteController = module.get<RemoteController>(RemoteController);
  });

  describe('remoteController', () => {
    it('controller should be defined', () => {
      expect(remoteController).toBeDefined();
    });
  });

  // TODO: Add tests for all endpoints
});
