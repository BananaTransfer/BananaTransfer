import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { FileController } from './file.controller';
import { FileService } from './file.service';

describe('FileController', () => {
  let fileController: FileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [FileController],
      providers: [FileService],
    }).compile();

    fileController = module.get<FileController>(FileController);
  });

  describe('fileController', () => {
    it('controller should be defined', () => {
      expect(fileController).toBeDefined();
    });
  });

  // TODO: Add tests for endpoints/methods
});
