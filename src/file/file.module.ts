import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';

// This module handles all file sharing related operations that are done by the authenticated users

@Module({
  imports: [],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
