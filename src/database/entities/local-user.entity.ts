import { ChildEntity, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { UserStatus } from './enums';
import { TrustedRecipient } from './trusted-recipient.entity';

@ChildEntity()
export class LocalUser extends User {
  @Column({ type: 'enum', enum: UserStatus })
  status: UserStatus;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @Column({ type: 'text' })
  password_hash: string;

  @Column({ type: 'text' })
  private_key_encrypted: string;

  @Column({ type: 'text' })
  private_key_salt: string;

  @Column({ type: 'text' })
  private_key_iv: string;

  @Column({ type: 'text' })
  public_key: string;

  @Column({ type: 'timestamp', nullable: true })
  key_created_at: Date;

  @OneToMany(() => TrustedRecipient, (tr) => tr.localUser)
  trustedRecipients: TrustedRecipient[];
}
