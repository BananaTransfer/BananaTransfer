import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsAlphanumeric,
  IsLowercase,
} from 'class-validator';

export class LoginDto {
  @IsAlphanumeric()
  @IsLowercase()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(32)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(256)
  password: string;
}
