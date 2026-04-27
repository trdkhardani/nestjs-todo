import { Module } from '@nestjs/common';
import { TaskService } from './tasks.service';
import { TaskController } from './tasks.controller';
import { CacheModule } from 'src/core/cache/cache.module';
import { QueueModule } from 'src/core/queue/queue.module';

@Module({
  imports: [CacheModule, QueueModule],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}
