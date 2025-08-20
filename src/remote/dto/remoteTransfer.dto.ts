import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsEmail,
  IsLowercase,
} from 'class-validator';

export class RemoteTransferDto {
  @IsUUID()
  id: string;

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
  size: string;

  @IsEmail()
  @IsLowercase()
  @IsNotEmpty()
  senderAddress: string;

  @IsEmail()
  @IsLowercase()
  @IsNotEmpty()
  recipientAddress: string;
}
