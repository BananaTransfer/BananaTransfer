import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { AuthModule } from './auth/auth.module';
// import { DatabaseModule } from './database/database.module';
import { FileModule } from './file/file.module';
import { ServiceModule } from './service/service.module';
import { UserModule } from './user/user.module';

// The root module that organizes your NestJS application. It imports other modules, controllers, and providers (services).

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    AuthModule,
    // TODO: uncomment this when database is ready
    // DatabaseModule,
    FileModule,
    ServiceModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
