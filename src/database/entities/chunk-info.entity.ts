import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { FileTransfer } from './file-transfer.entity';

@Entity()
export class ChunkInfo {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  chunkNumber: number;

  @Column({ type: 'int' })
  chunkSize: number;

  @Column({ type: 'text' })
  etag: string;

  @Column({ type: 'text' })
  s3Path: string;

  @Column({ type: 'boolean', default: false })
  isUploaded: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => FileTransfer, (fileTransfer) => fileTransfer.chunks)
  fileTransfer: FileTransfer;
}
