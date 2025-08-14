import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChunkedTransferDto {
  @IsOptional()
  @IsString()
  chunkData?: string; // base64 encoded chunk data

  @IsOptional()
  @Transform(({ value }) => parseInt(String(value)))
  chunkIndex?: number;

  @IsOptional()
  @Transform(({ value }) => String(value) === 'true' || value === true)
  isLastChunk?: boolean;

  @IsOptional()
  @IsString()
  iv?: string;

  // Transfer metadata (only required on first chunk)
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  recipientUsername?: string;

  @IsOptional()
  @IsString()
  symmetricKeyEncrypted?: string;

  @IsOptional()
  @IsString()
  signatureSender?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(String(value)))
  totalFileSize?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(String(value)))
  totalChunks?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(String(value)))
  chunkSize?: number;

  @IsOptional()
  @IsString()
  fileContent?: string; // base64 encoded file content for single uploads

  @IsOptional()
  @IsString()
  _csrf?: string;
}
