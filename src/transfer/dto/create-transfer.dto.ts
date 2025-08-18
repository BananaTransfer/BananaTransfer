import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export default class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  symmetric_key_encrypted: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  recipient_public_key_hash: string;

  @IsBoolean()
  trust_recipient_key: boolean;
}
