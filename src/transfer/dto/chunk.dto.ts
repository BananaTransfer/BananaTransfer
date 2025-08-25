import {
  IsBase64,
  IsBoolean,
  IsByteLength,
  IsNumber,
  Min,
} from 'class-validator';

export class ChunkDto {
  @IsBase64()
  @IsByteLength(1, 7182746) // frontend generate 5MB chunk, base64 has at most a 37% overhead
  encryptedData: string;

  @IsBase64()
  @IsByteLength(12, 17) // IV is 12byte length in frontend, base64 has at most a 37% overhead
  iv: string;

  @IsNumber()
  @Min(0)
  chunkIndex: number;

  @IsBoolean()
  isLastChunk: boolean;
}
