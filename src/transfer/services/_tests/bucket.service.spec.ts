import { ConfigService } from '@nestjs/config';
import { BucketService } from '@transfer/services/bucket.service';
import { MinioContainer, StartedMinioContainer } from '@testcontainers/minio';
import { writeFile, unlink } from 'fs/promises';
import {
  CreateBucketCommand,
  BucketLocationConstraint,
  S3Client,
} from '@aws-sdk/client-s3';
import { join } from 'path';

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

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to S3', async () => {
    expect(await service.testConnection()).toBe(true);
  });
  //
  // it('should upload and download a file', async () => {
  //   // Write a temp file
  //   const testFilePath = join(__dirname, 'testupload.txt');
  //   await writeFile(testFilePath, 'banana!');
  //   const key = await service.uploadFile(testFilePath);
  //   expect(key).toBe('testupload.txt');
  //
  //   // Get file back from S3
  //   const downloadedPath = await service.getFile(key);
  //   const data = require('fs').readFileSync(downloadedPath, 'utf-8');
  //   expect(data).toBe('banana!');
  //
  //   // Clean up
  //   await unlink(testFilePath);
  //   await unlink(downloadedPath);
  // });

  it('should delete a file', async () => {
    const testFilePath = join(__dirname, 'todelete.txt');
    await writeFile(testFilePath, 'todelete!');
    const key = await service.uploadFile(testFilePath);
    await service.deleteFile(key);

    // Try to fetch (should throw)
    await expect(service.getFile(key)).rejects.toThrow();
    await unlink(testFilePath);
  });
});
