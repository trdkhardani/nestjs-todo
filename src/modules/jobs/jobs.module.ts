import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { QueueModule } from 'src/core/queue/queue.module';
import { NotificationService } from 'src/core/queue/queue-notification.service';

@Module({
  imports: [QueueModule],
  providers: [JobsService, NotificationService],
  controllers: [JobsController],
})
export class JobsModule {}
