import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { LocalUser } from './entities/local-user.entity';
import { RemoteUser } from './entities/remote-user.entity';
import { TrustedRecipient } from './entities/trusted-recipient.entity';
import { FileTransfer } from './entities/file-transfer.entity';
import { TransferLog } from './entities/transfer-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        //entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        entities: [
          User,
          LocalUser,
          RemoteUser,
          TrustedRecipient,
          FileTransfer,
          TransferLog,
        ],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
