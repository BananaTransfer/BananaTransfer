import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsEmail,
  IsLowercase,
  IsBase64,
  IsByteLength,
  Length,
  Matches,
} from 'class-validator';

export class RemoteTransferDto {
  @IsUUID()
  id: string;

  @IsBase64()
  @IsByteLength(600, 700)
  symmetric_key_encrypted: string;

  @IsString()
  @Length(3, 256)
  filename: string;

  @IsString()
  @Length(3, 256)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]*$/, {
    message: 'size must be a number',
  })
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
