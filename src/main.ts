import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
    }),
    {
      bufferLogs: true,
    },
  );
  const configService = app.get(ConfigService);
  app.enableCors();
  await app.register(helmet);
  app.useLogger(app.get(Logger));
  await app.listen(configService.get<number>('port') ?? 3000, '0.0.0.0');
}
bootstrap();
