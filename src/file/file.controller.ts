import { Controller, Get, UseGuards } from '@nestjs/common';
import { FileService } from './file.service';
import { LocalAuthGuard } from '../auth/local-auth.guard';

// all routes in this controller are protected by the LocalAuthGuard and require authentication
@UseGuards(LocalAuthGuard)
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // Example endpoint to get file data
  @Get()
  getFile(): string {
    return this.fileService.getFileData();
  }
}
