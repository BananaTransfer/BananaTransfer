import { IsString, Length } from 'class-validator';
export class SetKeysDto {
  @IsString()
  @Length(12, 256)
  password: string;

  @IsString()
  @Length(3000, 3500)
  privateKeyEncrypted: string;

  @IsString()
  @Length(44, 44)
  privateKeySalt: string;

  @IsString()
  @Length(16, 16)
  privateKeyIv: string;

  @IsString()
  @Length(736, 736)
  publicKey: string;
}
