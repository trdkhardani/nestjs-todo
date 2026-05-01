import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { CacheModule } from 'src/core/cache/cache.module';
import { QueueModule } from 'src/core/queue/queue.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [CacheModule, QueueModule, UtilsModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
