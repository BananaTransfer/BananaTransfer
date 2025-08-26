import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client';
import { createReadStream, createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class BucketService {
  private readonly logger = new Logger(BucketService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    const isLocal = !!this.configService.get<string>('S3_ENDPOINT');
    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION'),
      ...(isLocal && {
        endpoint: this.configService.get<string>('S3_ENDPOINT'),
        forcePathStyle: true,
        credentials: {
          accessKeyId: this.configService.get<string>('S3_CLIENT_ID'),
          secretAccessKey: this.configService.get<string>('S3_CLIENT_SECRET'),
        },
      }),
    } as S3ClientConfig);

    this.bucket = this.configService.get<string>('S3_BUCKET') as string;
  }

  /**
   * Uploads a Buffer directly to S3.
   * Returns the key of the uploaded object.
   */
  async putObject(key: string, buffer: Buffer): Promise<void> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
        }),
      );
    } catch (error) {
      this.logger.error('Failed to upload object to S3', error);

      throw new InternalServerErrorException(
        `Failed to upload object to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async listFiles(prefix: string): Promise<string[]> {
    try {
      const keys: string[] = [];
      let continuationToken: string | undefined;

      while (true) {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const result = await this.s3Client.send(command);

        if (result.Contents == undefined) {
          return [];
        }

        const newKeys = result.Contents.map((object) => object.Key).filter(
          (key) => key != null,
        );

        keys.push(...newKeys);

        if (!result.IsTruncated) {
          // all matching files returned
          break;
        }

        continuationToken = result.NextContinuationToken;
      }

      return keys;
    } catch (error) {
      this.logger.error('Failed to list files from S3', error);
      const message = (error as { message?: string })?.message;

      throw new InternalServerErrorException(
        'Failed to list files from S3',
        message,
      );
    }
  }

  /**
   * Uploads a file from the given path to S3.
   * Returns the key of the uploaded object.
   */
  async uploadFile(filePath: string): Promise<string> {
    const key = uuidv4();
    const fileStream = createReadStream(filePath);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: fileStream,
        }),
      );

      return key;
    } catch (error: any) {
      this.logger.error('Failed to upload file to S3', error);
      const message = (error as { message?: string })?.message;

      throw new InternalServerErrorException(
        'Failed to upload file to S3',
        message,
      );
    }
  }

  /**
   * Downloads a file from S3 by key.
   * Returns the path to a temporary file containing the downloaded data.
   *
   * The caller must delete the returned file path
   */
  async getFile(key: string): Promise<string> {
    // Generate a unique temp file path. Does not directly use the key
    // to generate a file path to avoid concurrency issue if a user
    //  requests multiple times the same file at the same time
    const tmpDownloadDir = await mkdtemp(join(tmpdir(), 'download-'));
    const tmpFile = join(tmpDownloadDir, btoa(key));

    try {
      const result = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      // credits to https://github.com/aws/aws-sdk-js-v3/issues/5582#issuecomment-1854907253
      const writeStream = createWriteStream(tmpFile, 'binary');
      const stream = new WritableStream({
        write(chunk) {
          writeStream.write(chunk);
        },
        close() {
          writeStream.close();
        },
        abort(err) {
          writeStream.destroy(err as Error);
          throw err;
        },
      });

      await new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(null));
        writeStream.on('error', reject);
        result.Body?.transformToWebStream()
          .pipeTo(stream)
          // ignored since already catched by the writeStream
          .then(() => {})
          .catch(() => {});
      });

      return tmpFile;
    } catch (error) {
      await rm(tmpDownloadDir, { recursive: true, force: true });

      this.logger.error('Failed to download file from S3', error);
      const message = (error as { message?: string })?.message;

      throw new InternalServerErrorException(
        'Failed to download file from S3',
        message,
      );
    }
  }

  /**
   * Deletes a file from S3 by key.
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error('Failed to delete file from S3', error);
      const message = (error as { message?: string })?.message;

      throw new InternalServerErrorException(
        'Failed to delete file from S3',
        message,
      );
    }
  }

  /**
   * Test the S3 connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.s3Client.send(new ListBucketsCommand({}));
      return !!result.Buckets;
    } catch (error) {
      this.logger.error('S3 connection error:', error);
      return false;
    }
  }
}
