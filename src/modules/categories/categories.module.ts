import { Module } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CategoryController } from './categories.controller';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
