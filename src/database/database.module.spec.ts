import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { ConfigModule } from '@nestjs/config';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

describe('DatabaseModule (with Testcontainers)', () => {
  jest.setTimeout(60000);

  let postgresContainer: StartedPostgreSqlContainer;
  let testingModule: TestingModule;

  beforeAll(async () => {
    // Start PostgreSQL container
    postgresContainer = await new PostgreSqlContainer(
      'postgres:17-alpine',
    ).start();

    // Set env vars for NestJS to use the test DB
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = postgresContainer.getPort().toString();
    process.env.DB_USER = postgresContainer.getUsername();
    process.env.DB_PASS = postgresContainer.getPassword();
    process.env.DB_NAME = postgresContainer.getDatabase();

    // Now create the testing module
    testingModule = await Test.createTestingModule({
      imports: [DatabaseModule, ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
  });

  afterAll(async () => {
    await testingModule.close();

    await postgresContainer.stop();
  });

  describe('testingModule', () => {
    it('module should be defined', () => {
      expect(testingModule).toBeDefined();
    });
  });

  // Test TypeORM connection
  describe('Test db connection', () => {
    it('should connect to the database', () => {
      const dataSource = testingModule.get<DataSource>(getDataSourceToken());
      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });
  });
});
