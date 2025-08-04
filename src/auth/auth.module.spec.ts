import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// import { AuthModule } from '@auth/auth.module';
import { AuthController } from '@auth/controllers/auth.controller';
import { AuthService } from '@auth/services/auth.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { UserService } from '@user/services/user.service';

import { User } from '@database/entities/user.entity';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      // imports: [/*AuthModule,*/ ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtAuthGuard,
        UserService,
        JwtService,
        // Mock ConfigService
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'DOMAIN') return 'test-domain.com';
              if (key === 'S3_ENDPOINT') return 'http://localhost:9000';
              if (key === 'S3_REGION') return 'us-east-1';
              if (key === 'S3_CLIENT_ID') return 'test-access-key';
              if (key === 'S3_CLIENT_SECRET') return 'test-secret-key';
              if (key === 'S3_BUCKET') return 'test-bucket';
              return undefined;
            }),
          },
        },
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

  describe('JwtAuthGuard', () => {
    it('should provide JwtAuthGuard', () => {
      const jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
      expect(jwtAuthGuard).toBeDefined();
    });
  });
});
