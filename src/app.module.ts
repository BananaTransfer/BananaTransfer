import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from '@auth/auth.module';
import { JwtCoreModule } from '@auth/jwt/jwt-core.module';
import { DatabaseModule } from '@database/database.module';
import { RemoteInboundModule } from '@remote/remoteInbound.module';
import { RemoteOutboundModule } from '@remote/remoteOutbound.module';
import { TransferModule } from '@transfer/transfer.module';
import { UserModule } from '@user/user.module';

import { AppController } from './app.controller';

// The root module that organizes your NestJS application. It imports other modules, controllers, and providers (services).

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    AuthModule,
    JwtCoreModule,
    DatabaseModule,
    RemoteOutboundModule,
    RemoteInboundModule,
    TransferModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
