import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TransferService } from '@transfer/services/transfer.service';
import { MinioContainer, StartedMinioContainer } from '@testcontainers/minio';

import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

describe('TransferService (with Testcontainers MinIO)', () => {
  jest.setTimeout(60000);

  let service: TransferService;
  let minioContainer: StartedMinioContainer;

  beforeAll(async () => {
    // Start MinIO container using MinioContainer
    minioContainer = await new MinioContainer('minio/minio:latest').start();

    // Set env vars for TransferService to use MinIO
    process.env.S3_ENDPOINT = minioContainer.getConnectionUrl();
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_CLIENT_ID = minioContainer.getUsername();
    process.env.S3_CLIENT_SECRET = minioContainer.getPassword();
    process.env.S3_BUCKET = 'testbucket';

    // Now create the testing module
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        TransferService,
        // Mock the repositories for unit tests
        { provide: getRepositoryToken(FileTransfer), useValue: {} },
        { provide: getRepositoryToken(TransferLog), useValue: {} },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
  });

  afterAll(async () => {
    await minioContainer.stop();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });
  // TODO: Add tests for all methods in TransferService
});
