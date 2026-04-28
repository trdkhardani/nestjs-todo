import { Module } from '@nestjs/common';
import { TasksQueueService } from './tasks-queue.service';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { TasksQueueProcessor } from './tasks-queue.processor';
import { DatabaseModule } from '../database/database.module';
import { Connection } from 'mongoose';
import { JobSchema } from './entities/job.entity';

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
  ],
  exports: [TasksQueueService],
})
export class QueueModule {}
