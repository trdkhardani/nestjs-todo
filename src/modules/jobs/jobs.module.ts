import { Module } from '@nestjs/common';
import { JobService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { QueueModule } from 'src/core/queue/queue.module';
import { NotificationService } from 'src/core/queue/queue-notification.service';
import { Connection } from 'mongoose';
import { JobSchema } from 'src/core/queue/entities/job.entity';

@Module({
  imports: [QueueModule],
  providers: [
    JobService,
    {
      provide: 'JOB_MODEL',
      useFactory: (connection: Connection) =>
        connection.model('Job', JobSchema),
      inject: ['MONGODB_CONNECTION'],
    },
  ],
  controllers: [JobsController],
})
export class JobModule {}
