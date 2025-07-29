import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { LogInfo } from './enums';
import { User } from './user.entity';
import { FileTransfer } from './file-transfer.entity';

@Entity()
export class TransferLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'enum', enum: LogInfo })
  info: LogInfo;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.logs, { nullable: true })
  user: User;

  @ManyToOne(() => FileTransfer, (ft) => ft.logs)
  fileTransfer: FileTransfer;
}
