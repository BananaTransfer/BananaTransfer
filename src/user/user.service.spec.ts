import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [UserService],
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
