import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
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
