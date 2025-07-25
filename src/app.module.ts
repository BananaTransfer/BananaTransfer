import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { RemoteModule } from './remote/remote.module';
import { TransferModule } from './transfer/transfer.module';
import { UserModule } from './user/user.module';

// The root module that organizes your NestJS application. It imports other modules, controllers, and providers (services).

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    AuthModule,
    DatabaseModule,
    RemoteModule,
    TransferModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
