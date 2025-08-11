import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsLowercase,
  MaxLength,
  MinLength,
  IsString,
} from 'class-validator';

export class RegisterDto {
  @IsLowercase()
  @IsAlphanumeric()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(32)
  username: string;

  @IsEmail()
  @IsLowercase()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(256)
  password: string;
}
