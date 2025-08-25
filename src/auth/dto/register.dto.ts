import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsLowercase,
  IsString,
  Length,
} from 'class-validator';

export class RegisterDto {
  @IsLowercase()
  @IsAlphanumeric()
  @Length(4, 32)
  username: string;

  @IsEmail()
  @IsLowercase()
  @Length(3, 256)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(12, 256)
  password: string;
}
