import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// import { AuthModule } from '@auth/auth.module';
import { AuthController } from '@auth/controllers/auth.controller';
import { AuthService } from '@auth/services/auth.service';
import { LocalStrategy } from '@auth/strategies/local.strategy';
import { LocalAuthGuard } from '@auth/guards/local-auth.guard';
import { UserService } from '@user/services/user.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [/*AuthModule,*/ ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AuthController],
      providers: [
        AuthService,
        LocalStrategy,
        LocalAuthGuard,
        UserService,
        // Mock the repositories for unit tests
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(LocalUser), useValue: {} },
        { provide: getRepositoryToken(RemoteUser), useValue: {} },
        { provide: getRepositoryToken(TrustedRecipient), useValue: {} },
      ],
    }).compile();
  });

  describe('AuthModule', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });
  });

  describe('AuthController', () => {
    it('should provide AuthController', () => {
      const authController = module.get<AuthController>(AuthController);
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
