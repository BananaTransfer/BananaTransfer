import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
} from 'class-validator';
import { TransferStatus } from '@database/entities/enums';

export class TransferInfoDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  status: TransferStatus;

  @IsArray()
  @IsNumber({}, { each: true })
  chunks: number[];
}
