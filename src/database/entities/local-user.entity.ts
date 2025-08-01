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

<<<<<<< HEAD
  @Column()
  password_hash: string;
=======
  @Column({ type: 'text' })
  password_hash_salt: string;
>>>>>>> feature/database-migration

  @Column({ type: 'text' })
  private_key_encrypted: string;

<<<<<<< HEAD
  @Column()
  private_key_kdf: string;
=======
  @Column({ type: 'text' })
  private_key_kdf_salt: string;
>>>>>>> feature/database-migration

  @Column({ type: 'text' })
  public_key: string;

  @Column({ type: 'timestamp', nullable: true })
  key_created_at: Date;

  @OneToMany(() => TrustedRecipient, (tr) => tr.localUser)
  trustedRecipients: TrustedRecipient[];
}
