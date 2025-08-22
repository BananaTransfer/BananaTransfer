import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsIn,
} from 'class-validator';
import { TransferStatus } from '@database/entities/enums';

export class TransferInfoDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(TransferStatus))
  status: TransferStatus;

  @IsArray()
  @IsNumber({}, { each: true })
  chunks: number[];
}
