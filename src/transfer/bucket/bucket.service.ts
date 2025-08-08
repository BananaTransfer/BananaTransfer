import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client';
import {
  createReadStream,
  createWriteStream,
  promises as fsPromises,
} from 'fs';
import { basename } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { Readable } from 'stream';

import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';

@Injectable()
export class BucketService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(FileTransfer)
    private fileTransferRepository: Repository<FileTransfer>,
    @InjectRepository(TransferLog)
    private transferLogRepository: Repository<TransferLog>,
  ) {
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
   * Uploads a file from the given path to S3.
   * Returns the key of the uploaded object.
   */
  async uploadFile(filePath: string): Promise<string> {
    const fileName = basename(filePath);
    const key = fileName;

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
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to upload file to S3',
        error?.message,
      );
    }
  }

  /**
   * Downloads a file from S3 by key.
   * Returns the path to a temporary file containing the downloaded data.
   */
  async getFile(key: string): Promise<string> {
    // Generate a unique temp file path
    const tempFilePath = `${tmpdir()}/bananatransfer-${randomBytes(8).toString('hex')}-${basename(key)}`;

    try {
      const { Body } = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      // Body is a stream, pipe to temp file
      const writeStream = createWriteStream(tempFilePath);

      function isReadableStream(obj: any): obj is Readable {
        return obj && typeof obj.pipe === 'function';
      }

      if (isReadableStream(Body)) {
        await new Promise<void>((resolve, reject) => {
          Body.pipe(writeStream).on('error', reject).on('finish', resolve);
        });
      } else if (typeof (Body as any).transformToWebStream === 'function') {
        const nodeStream = Readable.fromWeb(
          (Body as any).transformToWebStream(),
        );
        await new Promise<void>((resolve, reject) => {
          nodeStream
            .pipe(writeStream)
            .on('error', reject)
            .on('finish', resolve);
        });
      } else {
        throw new Error('Unsupported S3 Body stream type');
      }

      return tempFilePath;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to download file from S3',
        error?.message,
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
      throw new InternalServerErrorException(
        'Failed to delete file from S3',
        error?.message,
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
      console.error('S3 connection error:', error);
      return false;
    }
  }
}
