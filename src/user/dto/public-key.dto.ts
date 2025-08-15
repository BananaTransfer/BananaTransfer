import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class PublicKeyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(736)
  @MaxLength(736)
  publicKey: string;
}
