import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';

describe('AppModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ServeStaticModule.forRoot({
          rootPath: join(__dirname, '..', 'public'),
        }),
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

  afterAll(async () => {
    await module.close();
  });

  // TODO: Add tests for static content
});
