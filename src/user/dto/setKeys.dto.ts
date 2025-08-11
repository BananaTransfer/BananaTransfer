import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
export class SetKeysDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(256)
  password: string;

  // TODO: specify the exact length for the keys, iv and salt
  @IsString()
  @IsNotEmpty()
  @MinLength(1200)
  @MaxLength(3189)
  privateKeyEncrypted: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(40)
  @MaxLength(100)
  privateKeySalt: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(126)
  privateKeyIv: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(127)
  @MaxLength(1256)
  publicKey: string;
}
