import {
  IsBase64,
  IsBoolean,
  IsByteLength,
  IsNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class ChunkDto {
  @IsString() // IsBase64 does not handle huge input well
  @IsByteLength(1, 7182746) // frontend generate 5MB chunk, base64 has at most a 37% overhead
  encryptedData: string;

  @IsBase64()
  @Length(16, 16)
  iv: string;

  @IsNumber()
  @Min(0)
  chunkIndex: number;

  @IsBoolean()
  isLastChunk?: boolean;
}
