import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client';

@Injectable()
export class FileService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    if (process.env.S3_ENDPOINT) {
      // for local deployment or deployment with custom S3 server
      this.s3Client = new S3Client({
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_CLIENT_ID,
          secretAccessKey: process.env.S3_CLIENT_SECRET,
        },
      } as any as S3ClientConfig);
    } else {
      // for cloud deployment using AWS S3 and EC2 attached role
      this.s3Client = new S3Client({
        region: process.env.S3_REGION,
      } as any as S3ClientConfig);
    }

    this.bucket = process.env.S3_BUCKET as string;
  }

  getFileData(): string {
    return 'File data';
  }
}
