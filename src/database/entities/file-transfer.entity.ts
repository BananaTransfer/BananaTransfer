import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { TransferStatus } from './enums';
import { TransferLog } from './transfer-log.entity';
import { ChunkInfo } from './chunk-info.entity';

@Entity()
export class FileTransfer {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'text' })
  symmetric_key_encrypted: string;

  @Column({ type: 'text' })
  signature_sender: string;

  @Column({ type: 'enum', enum: TransferStatus })
  status: TransferStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'text' })
  filename: string;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text', nullable: true })
  s3_path: string;

  @Column({ type: 'int', nullable: true })
  totalChunks: number;

  @Column({ type: 'int', nullable: true })
  uploadedChunks: number;

  @Column({ type: 'int', nullable: true })
  chunkSize: number;

  @Column({ type: 'text', nullable: true })
  multipartUploadId: string;

  @ManyToOne(() => User, (user) => user.sentTransfers)
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedTransfers)
  receiver: User;

  @OneToMany(() => TransferLog, (log) => log.fileTransfer)
  logs: TransferLog[];

  @OneToMany(() => ChunkInfo, (chunk) => chunk.fileTransfer)
  chunks: ChunkInfo[];
}
