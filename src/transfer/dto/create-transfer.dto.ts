import { IsNotEmpty, IsString } from 'class-validator';

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
  receiver: string;
}
