import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LocalUser } from './local-user.entity';
import { User } from './user.entity';

@Entity()
export class TrustedRecipient {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  public_key_hash: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => LocalUser, (localUser) => localUser.trustedRecipients)
  localUser: LocalUser;

  @ManyToOne(() => User)
  user: User;
}
