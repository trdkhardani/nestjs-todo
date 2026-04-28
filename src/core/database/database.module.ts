import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { mongoProvider } from './mongoose.service';

@Global()
@Module({
  providers: [PrismaService, ...mongoProvider],
  exports: [PrismaService, ...mongoProvider],
})
export class DatabaseModule {}
