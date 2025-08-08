import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from '@user/services/password.service';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    passwordService = module.get<PasswordService>(PasswordService);
  });

  describe('passwordService', () => {
    it('service should be defined', () => {
      expect(passwordService).toBeDefined();
    });
  });

  // TODO: Add tests for all methods in PasswordService
});
