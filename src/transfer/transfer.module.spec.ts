import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// import { TransferModule } from './transfer.module';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { UserService } from '../user/user.service';

import { User } from '../database/entities/user.entity';
import { LocalUser } from '../database/entities/local-user.entity';
import { RemoteUser } from '../database/entities/remote-user.entity';
import { TrustedRecipient } from '../database/entities/trusted-recipient.entity';
import { FileTransfer } from '../database/entities/file-transfer.entity';
import { TransferLog } from '../database/entities/transfer-log.entity';

describe('TransferModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [/*TransferModule,*/ ConfigModule.forRoot({ isGlobal: true })],
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
