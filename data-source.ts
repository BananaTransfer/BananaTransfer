import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './src/database/entities/user.entity';
import { LocalUser } from './src/database/entities/local-user.entity';
import { RemoteUser } from './src/database/entities/remote-user.entity';
import { TrustedRecipient } from './src/database/entities/trusted-recipient.entity';
import { FileTransfer } from './src/database/entities/file-transfer.entity';
import { TransferLog } from './src/database/entities/transfer-log.entity';

console.log('DB_HOST:', process.env.DB_HOST);

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    User,
    LocalUser,
    RemoteUser,
    TrustedRecipient,
    FileTransfer,
    TransferLog,
  ],
  migrations: ['src/database/migrations/*.ts'],
});
