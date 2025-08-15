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

  @ManyToOne(() => User, (user) => user.sentTransfers)
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedTransfers)
  receiver: User;

  @OneToMany(() => TransferLog, (log) => log.fileTransfer)
  logs: TransferLog[];
}
