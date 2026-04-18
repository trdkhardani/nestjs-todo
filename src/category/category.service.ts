import { Injectable } from '@nestjs/common';
// import { UpdateCategoryDto } from './dto/update-category.dto';
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

  // async getCategoryById(id: number): Promise<Category> {
  //   return `This action returns a #${id} category`;
  // }

  // update(id: number, updateCategoryDto: UpdateCategoryDto) {
  //   return `This action updates a #${id} category`;
  // }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
