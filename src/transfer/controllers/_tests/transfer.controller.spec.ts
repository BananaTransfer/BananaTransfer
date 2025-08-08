import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { TransferController } from '@transfer/controllers/transfer.controller';
import { TransferService } from '@transfer/services/transfer.service';
import { UserService } from '@user/services/user.service';
import { PasswordService } from '@user/services/password.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';
import { BucketService } from '@transfer/services/bucket.service';

describe('TransferController', () => {
  let transferController: TransferController;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // imports: [ConfigModule.forRoot({ isGlobal: true })], // Commented Since there is no .env file for now
      controllers: [TransferController],
      providers: [
        BucketService,
        TransferService,
        UserService,
        PasswordService,
        JwtService,
        // Mock ConfigService
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'DOMAIN') return 'test-domain.com';
              if (key === 'S3_ENDPOINT') return 'http://localhost:9000';
              if (key === 'S3_REGION') return 'us-east-1';
              if (key === 'S3_CLIENT_ID') return 'test-access-key';
              if (key === 'S3_CLIENT_SECRET') return 'test-secret-key';
              if (key === 'S3_BUCKET') return 'test-bucket';
              return undefined;
            }),
          },
        },
        // Mock the repositories for unit tests
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: getRepositoryToken(LocalUser), useValue: mockRepository },
        { provide: getRepositoryToken(RemoteUser), useValue: mockRepository },
        {
          provide: getRepositoryToken(TrustedRecipient),
          useValue: mockRepository,
        },
        { provide: getRepositoryToken(FileTransfer), useValue: mockRepository },
        { provide: getRepositoryToken(TransferLog), useValue: mockRepository },
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
