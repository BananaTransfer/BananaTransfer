import {
  IsBase64,
  IsBoolean,
  IsNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class ChunkDto {
  @IsString() // IsBase64 does not handle huge input well, size not checked because it is already enforced at reverse proxy level
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
