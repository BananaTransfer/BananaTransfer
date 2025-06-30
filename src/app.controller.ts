import { Controller, Get, Post, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

// Handles incoming HTTP requests, defines routes, and returns responses. It acts as the entry point for client requests.

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // hello world with a simple text response (uses service)
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // hello world with a rendered HTML response (uses template engine pug)
  @Get('hello')
  renderHello(@Res() res: Response): void {
    res.render('index');
  }
}
