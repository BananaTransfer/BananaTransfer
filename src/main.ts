import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import * as express from 'express';

import { AppModule } from './app.module';

// This is the entry point of the NestJS application. It bootstraps the application, sets up the view engine, and serves static assets.

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, 'public')); // serve static assets (bootstrap CSS)
  app.setBaseViewsDir(join(__dirname, '..', 'views')); // set the base directory for views templates
  app.setViewEngine('pug'); // set the view engine to Pug
  app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies (as sent by HTML forms)
  app.use(cookieParser()); // parse cookies from the request
  app.use(
    // Enable CSRF protection module
    csurf({
      cookie: {
        httpOnly: true,
        sameSite: 'strict',
        // secure prevents the cookie to be sent in non https requests, this needs to be disabled in dev
        secure: process.env.NODE_ENV !== 'dev',
      },
    }) as express.RequestHandler,
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch(console.error);
