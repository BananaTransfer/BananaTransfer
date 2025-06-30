import { Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  getFileData(): string {
    return 'File data';
  }
}
