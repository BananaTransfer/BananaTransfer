import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('authService', () => {
    it('service should be defined', () => {
      expect(authService).toBeDefined();
    });
  });

  // TODO: Add tests for all methods in AuthService
});
