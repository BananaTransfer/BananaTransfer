import { TransferStatus } from '@database/entities/enums';

export default class TransferDto {
  id: number;
  symmetric_key_encrypted: string;
  signature_sender: string;
  status: TransferStatus;
  created_at: Date;
  filename: string;
  subject: string;
  chunks: number[];
}
