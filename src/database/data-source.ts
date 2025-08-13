import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { LocalUser } from './entities/local-user.entity';
import { RemoteUser } from './entities/remote-user.entity';
import { TrustedRecipient } from './entities/trusted-recipient.entity';
import { FileTransfer } from './entities/file-transfer.entity';
import { TransferLog } from './entities/transfer-log.entity';
import { ChunkInfo } from './entities/chunk-info.entity';

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
    ChunkInfo,
  ],
  migrations: [process.env.DB_MIGRATION_PATH || 'src/database/migrations/*.ts'],
});
