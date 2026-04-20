import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, Req } from '@nestjs/common';
import { CategoryService } from './category.service';
import { type CreateCategoryDto, CreateCategorySchema } from './dto/create-category.dto';
import { type UpdateCategoryDto, UpdateCategorySchema } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import type { UserPayload } from 'src/interface/auth';
import type { ResponseInterface } from 'src/interface/response';

@Controller()
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  async createCategory(@Req() req: UserPayload, @Body() createCategoryDto: CreateCategoryDto): Promise<ResponseInterface> {
    const createCategory = await this.categoryService.createCategory({
      category_name: createCategoryDto.categoryName,
      user: {
        connect: {
          user_id: req.user.userId,
        },
      },
    });

    return {
      success: true,
      data: {
        categoryId: createCategory.category_id,
        categoryName: createCategory.category_name,
      },
      message: 'Category created successfully.',
    };
  }

  @Get()
  async getCategories(@Req() req: UserPayload): Promise<ResponseInterface> {
    const categories = await this.categoryService.getCategories(
      {
        OR: [
          {
            user_id: req.user.userId,
          },
          {
            user_id: null,
          },
        ],
      },
      {
        category_id: true,
        category_name: true,
      },
    );

    return {
      success: true,
      data: categories,
      message: 'Categories retrieved successfully',
    };
  }

  @Patch(':categoryId')
  async updateCategory(@Req() req: UserPayload, @Param('categoryId') categoryId: string, @Body(new ZodValidationPipe(UpdateCategorySchema)) updateCategoryDto: UpdateCategoryDto): Promise<ResponseInterface> {
    const updateCategory = await this.categoryService.updateCategory(
      {
        category_id: categoryId,
        user_id: req.user.userId,
      },
      {
        category_name: updateCategoryDto.categoryName,
      },
    );

    return {
      success: true,
      data: {
        categoryId: updateCategory.category_id,
        categoryName: updateCategory.category_name,
      },
      message: 'Category updated successfully.',
    };
  }

  @Delete(':categoryId')
  async deleteCategory(@Req() req: UserPayload, @Param('categoryId') categoryId: string): Promise<ResponseInterface> {
    const deleteCategory = await this.categoryService.deleteCategory({
      category_id: categoryId,
      user_id: req.user.userId,
    });

    return {
      success: true,
      data: {
        categoryId: deleteCategory.category_id,
        categoryName: deleteCategory.category_name,
      },
      message: 'Category deleted successfully.',
    };
  }
}
