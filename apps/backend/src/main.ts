/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { assetDir } from '@mas/backend-shared';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // Enable CORS for development
  app.enableCors({
    origin: process.env['CORS_ORIGIN'] || ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Building Resilient Professionals')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useStaticAssets(assetDir('introduction'), { prefix: '/assets/introduction' });
  // The production frontend serves public uploads from its shared assets
  // volume. Expose the same path from the API for local Angular development,
  // where the dev server proxies /assets/rich-text to this process.
  app.useStaticAssets(assetDir('rich-text'), { prefix: '/assets/rich-text' });

  const port = process.env['API_PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
