import {
  IsBoolean,
  IsString,
  IsEmail,
  IsBase64,
  IsByteLength,
  Length,
  IsLowercase,
} from 'class-validator';

export class CreateTransferDto {
  @IsBase64()
  @IsByteLength(600, 700)
  symmetric_key_encrypted: string;

  @IsString()
  @Length(3, 256)
  filename: string;

  @IsString()
  @Length(3, 256)
  subject: string;

  @IsEmail()
  @Length(3, 256)
  @IsLowercase()
  recipient: string;

  @IsString()
  @Length(64, 64)
  recipient_public_key_hash: string;

  @IsBoolean()
  trust_recipient_key: boolean;
}
