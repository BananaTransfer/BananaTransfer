import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
//import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserController } from '@user/controllers/user.controller';
import { UserService } from '@user/services/user.service';
import { PasswordService } from '@user/services/password.service';
import { AuthService } from '@auth/services/auth.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

describe('UserController', () => {
  let userController: UserController;

  const mockRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // imports: [ConfigModule.forRoot({ isGlobal: true })], // Commented Since there is no .env file for now
      controllers: [UserController],
      providers: [
        UserService,
        PasswordService,
        AuthService,
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
        {
          provide: getRepositoryToken(LocalUser),
          useValue: mockRepository,
        },

        {
          provide: getRepositoryToken(RemoteUser),
          useValue: mockRepository,
        },

        {
          provide: getRepositoryToken(TrustedRecipient),
          useValue: mockRepository,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
  });

  describe('userController', () => {
    it('controller should be defined', () => {
      expect(userController).toBeDefined();
    });
  });

  // TODO: Add tests for all endpoints
});
