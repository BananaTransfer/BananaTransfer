import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UserService } from './user.service';

import { User } from '../database/entities/user.entity';
import { LocalUser } from '../database/entities/local-user.entity';
import { RemoteUser } from '../database/entities/remote-user.entity';
import { TrustedRecipient } from '../database/entities/trusted-recipient.entity';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        UserService,
        // Mock the repositories for unit tests

        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(LocalUser), useValue: {} },
        { provide: getRepositoryToken(RemoteUser), useValue: {} },
        { provide: getRepositoryToken(TrustedRecipient), useValue: {} },
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
      expect(() => userService.setUserKeys('priv', 'pub')).not.toThrow();
    });
  });

  describe('getPublicKey', () => {
    it('should throw NotFoundException if user does not exist', () => {
      expect(() => userService.getPublicKey('unknown')).toThrow();
    });
  });
});
