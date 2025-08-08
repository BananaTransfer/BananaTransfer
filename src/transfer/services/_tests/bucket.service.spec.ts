import { ConfigService } from '@nestjs/config';
import { BucketService } from '@transfer/services/bucket.service';
import { MinioContainer, StartedMinioContainer } from '@testcontainers/minio';
import { writeFile, readFile, rm } from 'fs/promises';
import {
  CreateBucketCommand,
  BucketLocationConstraint,
  S3Client,
} from '@aws-sdk/client-s3';
import { join } from 'path';
import { tmpdir } from 'os';
import validator from 'validator';

describe('BucketService (with Testcontainers MinIO)', () => {
  jest.setTimeout(60000);

  let service: BucketService;
  let minioContainer: StartedMinioContainer;

  beforeAll(async () => {
    minioContainer = await new MinioContainer('minio/minio:latest').start();

    process.env.S3_ENDPOINT = minioContainer.getConnectionUrl();
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_CLIENT_ID = minioContainer.getUsername();
    process.env.S3_CLIENT_SECRET = minioContainer.getPassword();
    process.env.S3_BUCKET = 'testbucket';

    service = new BucketService(new ConfigService());

    // Ensure the bucket exists (little hack to retrieve the initiated client)
    const s3Client = (service as unknown as { s3Client: S3Client }).s3Client;
    await s3Client.send(
      new CreateBucketCommand({
        Bucket: process.env.S3_BUCKET,
        CreateBucketConfiguration: {
          LocationConstraint: process.env.S3_REGION as BucketLocationConstraint,
        },
      }),
    );
  });

  afterAll(async () => {
    await minioContainer.stop();
  });

  describe('testConnection', () => {
    it('should be connected to s3', async () => {
      expect(await service.testConnection()).toBe(true);
    });
  });

  it('should upload and download a file', async () => {
    // Write a temp file
    const testFilePath = join(tmpdir(), 'testupload.txt');
    await writeFile(testFilePath, 'banana!');

    const key = await service.uploadFile(testFilePath);
    await rm(testFilePath);

    expect(validator.isUUID(key)).toBe(true);

    // Get file back from S3
    const downloadedPath = await service.getFile(key);
    const data = await readFile(downloadedPath, 'utf-8');
    await rm(downloadedPath);

    expect(data).toBe('banana!');
  });

  it('should delete a file', async () => {
    const testFilePath = join(tmpdir(), 'todelete.txt');
    await writeFile(testFilePath, 'todelete!');
    const key = await service.uploadFile(testFilePath);
    await rm(testFilePath);
    await service.deleteFile(key);

    // Try to fetch (should throw)
    await expect(service.getFile(key)).rejects.toThrow();
  });
});
