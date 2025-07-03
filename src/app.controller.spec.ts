import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Response } from 'express';

// this file contains the unit tests to verify the controller's behavior

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      const mockResponse = {
        render: jest.fn(),
      } as any as Response;

      appController.renderHello(mockResponse);

      expect(mockResponse.render).toHaveBeenCalledWith('index');
    });
  });
});
