import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
export class SetKeysDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(256)
  password: string;

  // TODO: specify the exact length for the keys and the kdf
  @IsString()
  @IsNotEmpty()
  @MinLength(127)
  @MaxLength(1256)
  private_key_encrypted: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(127)
  @MaxLength(1256)
  private_key_kdf: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(127)
  @MaxLength(1256)
  public_key: string;
}
