import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { CategoryService } from 'src/modules/categories/categories.service';
import { Category } from 'generated/prisma/browser';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private categoryService: CategoryService) {}

  async createCategory(data: Prisma.CategoryCreateInput): Promise<Category> {
    return await this.categoryService.createCategory(data);
  }

  findAll() {
    return `This action returns all admin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} admin`;
  }

  update(id: number, updateAdminDto: UpdateAdminDto) {
    return `This action updates a #${id} admin`;
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }
}
