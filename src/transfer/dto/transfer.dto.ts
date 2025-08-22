import { TransferStatus, LogInfo } from '@database/entities/enums';

export class TransferLogDto {
  id: number;
  info: LogInfo;
  created_at: Date;
}

export class TransferDto {
  id: string;
  symmetric_key_encrypted: string;
  status: TransferStatus;
  created_at: Date;
  filename: string;
  subject: string;
  chunks: number[];
  senderId: number;
  receiverId: number;
  senderAddress: string;
  receiverAddress: string;
  size?: string;
  logs: TransferLogDto[];
}
