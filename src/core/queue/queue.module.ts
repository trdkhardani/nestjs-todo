import { Module } from '@nestjs/common';
import { TasksQueueService } from './tasks-queue.service';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { TasksQueueProcessor } from './tasks-queue.processor';
import { DatabaseModule } from '../database/database.module';
import { Connection } from 'mongoose';
import { JobSchema } from './entities/job.entity';
import { NotificationService } from './queue-notification.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { WsModule } from 'src/websocket/ws.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';
import { existsSync } from 'fs';
import { join } from 'path';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailQueueService } from './email-queue.service';

const getMailTemplateDirs = () => {
  const candidates = [
    join(process.cwd(), 'src', 'mail', 'templates'),
    join(process.cwd(), 'dist', 'mail', 'templates'),
    join(process.cwd(), 'dist', 'src', 'mail', 'templates'),
  ];

  return candidates.filter(
    (candidate, index) =>
      candidates.indexOf(candidate) === index && existsSync(candidate),
  );
};

@Module({
  imports: [
    DatabaseModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('redisUrl'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'tasks-queue',
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('redisUrl'),
      }),
    }),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('mailHost'),
          secure:
            configService.get<string>('mailHost') === 'development'
              ? false
              : true,
          port: 465,
          auth: {
            user: configService.get<string>('mailUser'),
            pass: configService.get<string>('mailPass'),
          },
        },
        defaults: {
          from: 'NestJS ToDo App <noreply@example.com>',
        },
        template: {
          dir: join(process.cwd(), 'src', 'mail', 'templates'),
          dirs: getMailTemplateDirs(),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
    }),
    WsModule,
  ],
  providers: [
    TasksQueueProcessor,
    TasksQueueService,
    {
      provide: 'JOB_MODEL',
      useFactory: (connection: Connection) =>
        connection.model('Job', JobSchema),
      inject: ['MONGODB_CONNECTION'],
    },
    EmailQueueProcessor,
    EmailQueueService,
  ],
  exports: [TasksQueueService, EmailQueueService],
})
export class QueueModule {}
