import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CategoryModule } from 'src/category/category.module';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [CategoryModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
