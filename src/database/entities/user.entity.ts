import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  TableInheritance,
} from 'typeorm';
import { FileTransfer } from './file-transfer.entity';
import { TransferLog } from './transfer-log.entity';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  username: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => FileTransfer, (ft) => ft.sender)
  sentTransfers: FileTransfer[];

  @OneToMany(() => FileTransfer, (ft) => ft.receiver)
  receivedTransfers: FileTransfer[];

  @OneToMany(() => TransferLog, (log) => log.user)
  logs: TransferLog[];
}
