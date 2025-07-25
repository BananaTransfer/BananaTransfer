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

  @Column()
  symmetric_key_encrypted: string;

  @Column()
  signature_sender: string;

  @Column({ type: 'enum', enum: TransferStatus })
  status: TransferStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column()
  filename: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  s3_path: string;

  @ManyToOne(() => User, (user) => user.sentTransfers)
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedTransfers)
  receiver: User;

  @OneToMany(() => TransferLog, (log) => log.fileTransfer)
  logs: TransferLog[];
}
