import {
  IsString,
  IsAlphanumeric,
  IsLowercase,
  Length,
} from 'class-validator';

export class LoginDto {
  @IsAlphanumeric()
  @IsLowercase()
  @Length(4, 32)
  username: string;

  @IsString()
  @Length(12, 256)
  password: string;
}
