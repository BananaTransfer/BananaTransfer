import { LocalUser } from '@database/entities/local-user.entity';
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

  describe('hashPassword', () => {
    it('should hash the password correctly', async () => {
      const password = 'testPassword';
      const hashedPassword = await passwordService.hashPassword(password);
      expect(hashedPassword).not.toEqual(password);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testPassword';
      const localUser = {
        password_hash: await passwordService.hashPassword(password),
      };
      const result = await passwordService.validatePassword(
        localUser as LocalUser,
        password,
      );
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testPassword';
      const localUser = {
        password_hash: await passwordService.hashPassword('wrongPassword'),
      };
      const result = await passwordService.validatePassword(
        localUser as LocalUser,
        password,
      );
      expect(result).toBe(false);
    });
  });
});
