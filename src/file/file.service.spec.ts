import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { FileService } from './file.service';
import { MinioContainer, StartedMinioContainer } from '@testcontainers/minio';

describe('FileService (with Testcontainers MinIO)', () => {
  jest.setTimeout(60000);

  let service: FileService;
  let minioContainer: StartedMinioContainer;

  beforeAll(async () => {
    // Start MinIO container using MinioContainer
    minioContainer = await new MinioContainer('minio/minio:latest').start();

    // Set env vars for FileService to use MinIO
    process.env.S3_ENDPOINT = minioContainer.getConnectionUrl();
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_CLIENT_ID = minioContainer.getUsername();
    process.env.S3_CLIENT_SECRET = minioContainer.getPassword();
    process.env.S3_BUCKET = 'testbucket';

    // Now create the testing module
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [FileService],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  afterAll(async () => {
    await minioContainer.stop();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return true if S3 connection is successful', async () => {
    const result = await service.testConnection();
    expect(result).toBe(true);
  });
});
