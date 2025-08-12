import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
export class SetKeysDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(256)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3188)
  @MaxLength(3188)
  privateKeyEncrypted: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(44)
  @MaxLength(44)
  privateKeySalt: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(16)
  @MaxLength(16)
  privateKeyIv: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(736)
  @MaxLength(736)
  publicKey: string;
}
