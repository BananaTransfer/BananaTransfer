import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { FileService } from './file.service';

describe('FileService', () => {
  let service: FileService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [FileService],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  describe('fileService', () => {
    it('service should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('test connection', () => {
    it('should return true if S3 connection is successful', async () => {
      const result = await service.testConnection();
      expect(result).toBe(true);
    });
  });
});
