import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Prisma } from 'generated/prisma/client';
import {
  CreateCategoryInput,
  DeleteCategoryInput,
  GetCategoriesInput,
  UpdateCategoryInput,
} from './interfaces/category.interface';

type CategorySummary = Prisma.CategoryGetPayload<{
  select: {
    category_id: true;
    category_name: true;
  };
}>;

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async createCategory(createCategoryInput: CreateCategoryInput): Promise<CategorySummary> {
    return this.prisma.category.create({
      data: {
        category_name: createCategoryInput.name,
        user: {
          connect: {
            user_id: createCategoryInput.userId,
          },
        },
      },
      select: {
        category_id: true,
        category_name: true,
      },
    });
  }

  async getCategories(getCategoriesInput: GetCategoriesInput): Promise<CategorySummary[]> {
    return await this.prisma.category.findMany({
      where: {
        OR: [
          {
            user_id: getCategoriesInput.userId,
          },
          {
            user_id: null,
          },
        ],
      },
      select: {
        category_id: true,
        category_name: true,
      },
    });
  }

  async updateCategory(updateCategoryInput: UpdateCategoryInput): Promise<CategorySummary> {
    return await this.prisma.category.update({
      where: {
        category_id: updateCategoryInput.categoryId,
        user_id: updateCategoryInput.userId,
      },
      data: {
        category_name: updateCategoryInput.name,
      },
      select: {
        category_id: true,
        category_name: true,
      },
    });
  }

  async deleteCategory(deleteCategoryInput: DeleteCategoryInput): Promise<CategorySummary> {
    return await this.prisma.category.delete({
      where: {
        category_id: deleteCategoryInput.categoryId,
        user_id: deleteCategoryInput.userId,
      },
      select: {
        category_id: true,
        category_name: true,
      },
    });
  }
}
