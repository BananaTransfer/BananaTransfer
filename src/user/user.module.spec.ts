import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// import { UserModule } from './user.module';
import { UserController } from '@user/controllers/user.controller';
import { UserService } from '@user/services/user.service';
import { AuthService } from '@auth/services/auth.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

describe('UserModule', () => {
  let module: TestingModule;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      // imports: [/*UserModule,*/ ConfigModule.forRoot({ isGlobal: true })], // Commented Since there is no .env file for now
      controllers: [UserController],
      providers: [
        UserService,
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
        { provide: getRepositoryToken(LocalUser), useValue: mockRepository },
        { provide: getRepositoryToken(RemoteUser), useValue: mockRepository },
        {
          provide: getRepositoryToken(TrustedRecipient),
          useValue: mockRepository,
        },
      ],
    }).compile();
  });

  describe('UserModule', () => {
    it('module should be defined', () => {
      expect(module).toBeDefined();
    });
  });

  describe('UserController', () => {
    it('should be defined', () => {
      const userController = module.get<UserController>(UserController);
      expect(userController).toBeDefined();
    });
  });

  describe('UserService', () => {
    it('should be defined', () => {
      const userService = module.get<UserService>(UserService);
      expect(userService).toBeDefined();
    });
  });
});
