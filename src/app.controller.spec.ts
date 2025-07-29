import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import { AppController } from './app.controller';

// this file contains the unit tests to verify the app controller's behavior

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('appController', () => {
    it('controller should be defined', () => {
      expect(appController).toBeDefined();
    });
  });

  describe('/ (landing-page)', () => {
    it('/ should return landing-page (index)', () => {
      const mockResponse = {
        render: jest.fn(),
      } as any as Response;

      appController.renderHello(mockResponse);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockResponse.render).toHaveBeenCalledWith('index');
    });
  });
});
