import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { UserService } from '../user/user.service';

import { User } from '../database/entities/user.entity';
import { LocalUser } from '../database/entities/local-user.entity';
import { RemoteUser } from '../database/entities/remote-user.entity';
import { TrustedRecipient } from '../database/entities/trusted-recipient.entity';
import { FileTransfer } from '../database/entities/file-transfer.entity';
import { TransferLog } from '../database/entities/transfer-log.entity';

describe('TransferController', () => {
  let transferController: TransferController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [TransferController],
      providers: [
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
