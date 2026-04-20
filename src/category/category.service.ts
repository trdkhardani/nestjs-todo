import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Category, Prisma } from 'generated/prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async createCategory(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({
      data,
    });
  }

  async getCategories(categoryWhere: Prisma.CategoryWhereInput, categorySelect: Prisma.CategorySelect): Promise<Category[] | []> {
    return await this.prisma.category.findMany({
      where: categoryWhere,
      select: categorySelect,
    });
  }

  async updateCategory(categoryWhere: Prisma.CategoryWhereUniqueInput, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return await this.prisma.category.update({
      where: categoryWhere,
      data,
    });
  }

  async deleteCategory(categoryWhere: Prisma.CategoryWhereUniqueInput): Promise<Category> {
    return await this.prisma.category.delete({
      where: categoryWhere,
    });
  }
}
