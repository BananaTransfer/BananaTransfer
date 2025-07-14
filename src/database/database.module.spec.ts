import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { ConfigModule } from '@nestjs/config';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

describe('DatabaseModule', () => {
  let testingModule: TestingModule;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }), // Load .env for tests
        DatabaseModule,
      ],
    }).compile();
  });

  describe('testingModule', () => {
    it('module should be defined', () => {
      expect(testingModule).toBeDefined();
    });
  });

  // Test TypeORM connection (requires running DB)
  describe('Test db connection', () => {
    it('should connect to the database', () => {
      const dataSource = testingModule.get<DataSource>(getDataSourceToken());
      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });
  });
});
