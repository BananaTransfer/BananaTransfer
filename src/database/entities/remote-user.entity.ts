import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

@ChildEntity()
export class RemoteUser extends User {
  @Column()
  domain: string;
}
