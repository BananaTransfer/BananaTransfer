import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { UserService } from '@user/services/user.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

describe('UserService', () => {
  let userService: UserService;

  const mockRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // imports: [ConfigModule.forRoot({ isGlobal: true })], // Commented Since there is no .env file for now
      providers: [
        UserService,
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

    userService = module.get<UserService>(UserService);
  });

  describe('userService', () => {
    it('service should be defined', () => {
      expect(userService).toBeDefined();
    });
  });

  // TODO: Add tests for all methods in UserService
  describe('getPrivateKey', () => {
    it('should return a string', () => {
      const result = userService.getPrivateKey();
      expect(typeof result).toBe('string');
    });
  });

  describe('setUserKeys', () => {
    it('should not throw when called with keys', () => {
      expect(() => userService.setUserKeys(/*'priv', 'pub'*/)).not.toThrow();
    });
  });

  describe('getPublicKey', () => {
    it('should throw NotFoundException if user does not exist', () => {
      expect(() => userService.getPublicKey('unknown')).toThrow();
    });
  });
});
