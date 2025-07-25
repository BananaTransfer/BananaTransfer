import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { RemoteModule } from './remote/remote.module';
import { TransferModule } from './transfer/transfer.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';

describe('AppModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        AuthModule,
        RemoteModule,
        TransferModule,
        UserModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      controllers: [AppController],
    }).compile();
  });

  describe('AppModule', () => {
    it('module should be defined', () => {
      expect(module).toBeDefined();
    });
  });

  describe('AppController', () => {
    it('should be defined', () => {
      const appController = module.get<AppController>(AppController);
      expect(appController).toBeDefined();
    });
  });

  describe('AuthModule', () => {
    it('should be defined', () => {
      const authModule = module.get(AuthModule);
      expect(authModule).toBeDefined();
    });
  });

  describe('RemoteModule', () => {
    it('should be defined', () => {
      const remoteModule = module.get(RemoteModule);
      expect(remoteModule).toBeDefined();
    });
  });

  describe('TransferModule', () => {
    it('should be defined', () => {
      const transferModule = module.get(TransferModule);
      expect(transferModule).toBeDefined();
    });
  });

  describe('UserModule', () => {
    it('should be defined', () => {
      const userModule = module.get(UserModule);
      expect(userModule).toBeDefined();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
