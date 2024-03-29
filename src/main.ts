import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { NextFunction, Request, Response } from 'express';
// import { CorsOptions } from '@nestjs/common';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  const corsOptions = {
    origin: 'http://localhost:5173', // หรือ '*' สำหรับทุกรา origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };
  app.use(cors(corsOptions));
  await app.listen(3300);
}
bootstrap();
