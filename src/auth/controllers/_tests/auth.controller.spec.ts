import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AuthController } from '../auth.controller';
import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@user/services/user.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

describe('AuthController', () => {
  let authController: AuthController;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UserService,
        JwtService,
        // Mock ConfigService
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'DOMAIN') return 'test-domain.com';
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

    authController = module.get<AuthController>(AuthController);
  });

  describe('authController', () => {
    it('controller should be defined', () => {
      expect(authController).toBeDefined();
    });
  });

  describe('authService', () => {
    it('service should be defined', () => {
      const authService = authController['authService'];
      expect(authService).toBeDefined();
    });
  });

  // TODO: Add tests for all endpoints
});
