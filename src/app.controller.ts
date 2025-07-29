import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

// Handles incoming HTTP requests, defines routes, and returns responses. It acts as the entry point for client requests.

@Controller()
export class AppController {
  // BananaTransfer Landing-page (uses template engine pug)
  @Get('')
  renderHello(@Res() res: Response): void {
    res.render('index');
  }
}
