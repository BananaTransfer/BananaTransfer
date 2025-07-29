import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UserController } from './user.controller';
import { UserService } from './user.service';

import { User } from '../database/entities/user.entity';
import { LocalUser } from '../database/entities/local-user.entity';
import { RemoteUser } from '../database/entities/remote-user.entity';
import { TrustedRecipient } from '../database/entities/trusted-recipient.entity';

describe('UserController', () => {
  let userController: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
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

    userController = module.get<UserController>(UserController);
  });

  describe('userController', () => {
    it('controller should be defined', () => {
      expect(userController).toBeDefined();
    });
  });

  // TODO: Add tests for all endpoints
});
