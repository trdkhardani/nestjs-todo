import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, Req } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { type CreateCategoryDto, CreateCategorySchema } from './dto/create-category.dto';
import { type UpdateCategoryDto, UpdateCategorySchema } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { UserPayload } from 'src/modules/auth/interfaces/auth.interface';
import type { ResponseInterface } from 'src/common/interfaces/response.interface';

interface CategoryData {
  id: string;
  name: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  async createCategory(@Req() req: UserPayload, @Body() createCategoryDto: CreateCategoryDto): Promise<ResponseInterface<CategoryData>> {
    const createCategory = await this.categoryService.createCategory({
      userId: req.user.sub,
      name: createCategoryDto.name,
    });

    return {
      success: true,
      data: {
        id: createCategory.category_id,
        name: createCategory.category_name,
      },
      message: 'Category created successfully.',
    };
  }

  @Get()
  async getCategories(@Req() req: UserPayload): Promise<ResponseInterface<CategoryData[]>> {
    const categories = await this.categoryService.getCategories({
      userId: req.user.sub,
    });

    return {
      success: true,
      data: categories.map((category) => ({
        id: category.category_id,
        name: category.category_name,
      })),
      message: 'Categories retrieved successfully',
    };
  }

  @Patch(':categoryId')
  async updateCategory(@Req() req: UserPayload, @Param('categoryId') categoryId: string, @Body(new ZodValidationPipe(UpdateCategorySchema)) updateCategoryDto: UpdateCategoryDto): Promise<ResponseInterface<CategoryData>> {
    const updateCategory = await this.categoryService.updateCategory({
      categoryId,
      userId: req.user.sub,
      name: updateCategoryDto.name,
    });

    return {
      success: true,
      data: {
        id: updateCategory.category_id,
        name: updateCategory.category_name,
      },
      message: 'Category updated successfully.',
    };
  }

  @Delete(':categoryId')
  async deleteCategory(@Req() req: UserPayload, @Param('categoryId') categoryId: string): Promise<ResponseInterface<CategoryData>> {
    const deleteCategory = await this.categoryService.deleteCategory({
      categoryId,
      userId: req.user.sub,
    });

    return {
      success: true,
      data: {
        id: deleteCategory.category_id,
        name: deleteCategory.category_name,
      },
      message: 'Category deleted successfully.',
    };
  }
}
