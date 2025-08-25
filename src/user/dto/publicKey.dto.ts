import { IsString, Length } from 'class-validator';

export class PublicKeyDto {
  @IsString()
  @Length(736, 736)
  publicKey: string;
}
