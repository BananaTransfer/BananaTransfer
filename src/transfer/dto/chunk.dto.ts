import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChunkDto {
  @IsString()
  @IsNotEmpty()
  // base 64 encoded chunk data
  encryptedData: string;
  @IsString()
  @IsNotEmpty()
  // base 64 encoded iv
  iv: string;
  @IsNumber()
  chunkIndex: number;
  @IsBoolean()
  isLastChunk?: boolean;
}
