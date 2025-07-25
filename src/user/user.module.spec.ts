import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// import { UserModule } from './user.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

import { User } from '../database/entities/user.entity';
import { LocalUser } from '../database/entities/local-user.entity';
import { RemoteUser } from '../database/entities/remote-user.entity';
import { TrustedRecipient } from '../database/entities/trusted-recipient.entity';

describe('UserModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [/*UserModule,*/ ConfigModule.forRoot({ isGlobal: true })],
      controllers: [UserController],
      providers: [
        UserService,
        // Mock the repositories for unit tests
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(LocalUser), useValue: {} },
        { provide: getRepositoryToken(RemoteUser), useValue: {} },
        { provide: getRepositoryToken(TrustedRecipient), useValue: {} },
      ],
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
