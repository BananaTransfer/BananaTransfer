import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

// This is the entry point of the NestJS application. It bootstraps the application, sets up the view engine, and serves static assets.

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public')); // serve static assets (bootstrap CSS)
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('pug');
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch(console.error);
