import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [UserModule, ConfigModule.forRoot({ isGlobal: true })],
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
