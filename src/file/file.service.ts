import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client';

@Injectable()
export class FileService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_CLIENT_ID,
        secretAccessKey: process.env.S3_CLIENT_SECRET,
      },
    } as any as S3ClientConfig);

    this.bucket = process.env.S3_BUCKET as string;

    // USAGE EXAMPLE:
    // this.s3Client
    //   .send(new ListBucketsCommand())
    //   .then((data) => {
    //     console.log('List of available buckets: ');
    //     if (data.Buckets) {
    //       for (const bucket of data.Buckets) {
    //         console.log(bucket.Name);
    //       }
    //     }
    //   })
    //   .catch((err) => {
    //     console.error(`Could not list buckets, err ${err}`);
    //   });
  }

  getFileData(): string {
    return 'File data';
  }
}
