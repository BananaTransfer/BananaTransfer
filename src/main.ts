import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ForbiddenException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction, urlencoded, json } from 'express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import * as csrf from 'csrf';

import { AppModule } from './app.module';

// Extend Express Request interface to include csrfSecret and csrfToken
interface CsrfRequest extends Request {
  csrfSecret: string;
  csrfToken: () => string;
  cookies: { [key: string]: string };
}

const tokens = new csrf();

// This is the entry point of the NestJS application. It bootstraps the application, sets up the view engine, and serves static assets.

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, 'public')); // serve static assets (bootstrap CSS)
  app.setBaseViewsDir(join(__dirname, '..', 'views')); // set the base directory for views templates
  app.setViewEngine('pug'); // set the view engine to Pug

  app.use(urlencoded({ extended: true, limit: '2mb' })); // parse URL-encoded bodies (as sent by HTML forms)
  app.use(json({ limit: '10mb' })); // increase JSON body limit for encrypted chunk uploads
  app.useGlobalPipes(new ValidationPipe({ whitelist: true })); // setup global validation pipe for inputs

  app.use(cookieParser()); // parse cookies from the request

  // Middleware to generate CSRF token and set cookie
  app.use((req: CsrfRequest, res: Response, next: NextFunction) => {
    if (!req.cookies.csrfSecret) {
      const secret = tokens.secretSync();
      res.cookie('csrfSecret', secret, {
        httpOnly: true,
        sameSite: 'strict',
        // secure prevents the cookie to be sent in non https requests, this needs to be disabled in dev
        secure: process.env.NODE_ENV !== 'dev',
      });
      req.csrfSecret = secret;
    } else {
      req.csrfSecret = req.cookies.csrfSecret;
    }
    req.csrfToken = () => tokens.create(req.csrfSecret);
    next();
  });

  // Middleware to verify CSRF token on POST
  app.use((req: CsrfRequest, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && !req.path.startsWith('/remote/')) {
      const token = (req.body as { _csrf: string })?._csrf;
      if (!tokens.verify(req.csrfSecret, token)) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }
    next();
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch(console.error);
