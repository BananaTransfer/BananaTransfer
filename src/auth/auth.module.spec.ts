import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { LocalAuthGuard } from './local-auth.guard';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AuthModule, ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
  });

  describe('AuthModule', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });
  });

  describe('AuthController', () => {
    it('should provide AuthController', () => {
      const authController = module.get<AuthService>(AuthService);
      expect(authController).toBeDefined();
    });
  });

  describe('AuthService', () => {
    it('should provide AuthService', () => {
      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe('LocalStrategy', () => {
    it('should provide LocalStrategy', () => {
      const localStrategy = module.get<LocalStrategy>(LocalStrategy);
      expect(localStrategy).toBeDefined();
    });
  });

  describe('LocalAuthGuard', () => {
    it('should provide LocalAuthGuard', () => {
      const localAuthGuard = module.get<LocalAuthGuard>(LocalAuthGuard);
      expect(localAuthGuard).toBeDefined();
    });
  });
});
