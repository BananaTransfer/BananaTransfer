import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// import { RemoteModule } from './remote.module';
import { RemoteController } from './remote.controller';
import { RemoteService } from './remote.service';
import { TransferService } from '../transfer/transfer.service';
import { UserService } from '../user/user.service';

import { User } from '../database/entities/user.entity';
import { LocalUser } from '../database/entities/local-user.entity';
import { RemoteUser } from '../database/entities/remote-user.entity';
import { TrustedRecipient } from '../database/entities/trusted-recipient.entity';
import { FileTransfer } from '../database/entities/file-transfer.entity';
import { TransferLog } from '../database/entities/transfer-log.entity';

describe('RemoteModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [/*RemoteModule,*/ ConfigModule.forRoot({ isGlobal: true })],
      controllers: [RemoteController],
      providers: [
        RemoteService,
        TransferService,
        UserService,
        // Mock the repositories for unit tests
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(LocalUser), useValue: {} },
        { provide: getRepositoryToken(RemoteUser), useValue: {} },
        { provide: getRepositoryToken(TrustedRecipient), useValue: {} },
        { provide: getRepositoryToken(FileTransfer), useValue: {} },
        { provide: getRepositoryToken(TransferLog), useValue: {} },
      ],
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
