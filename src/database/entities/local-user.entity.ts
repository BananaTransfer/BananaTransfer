import { ChildEntity, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { UserStatus } from './enums';
import { TrustedRecipient } from './trusted-recipient.entity';

@ChildEntity()
export class LocalUser extends User {
  @Column({ type: 'enum', enum: UserStatus })
  status: UserStatus;

  @Column()
  email: string;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @Column()
  password_hash_salt: string;

  @Column()
  private_key_encrypted: string;

  @Column()
  private_key_kdf_salt: string;

  @Column()
  public_key: string;

  @Column({ type: 'timestamp', nullable: true })
  key_created_at: Date;

  @OneToMany(() => TrustedRecipient, (tr) => tr.localUser)
  trustedRecipients: TrustedRecipient[];
}
