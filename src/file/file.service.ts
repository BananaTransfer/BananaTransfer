import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client';

@Injectable()
export class FileService {
  private s3Client: S3Client;
  private bucket: string;

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

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.s3Client.send(new ListBucketsCommand({}));
      return !!result.Buckets;
    } catch (error) {
      console.error('S3 connection error:', error);
      return false;
    }
  }

  getFileData(): string {
    return 'File data';
  }
}
