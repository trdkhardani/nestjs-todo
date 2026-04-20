import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ResponseInterface } from 'src/common/interfaces/response.interface';
import { type CreateCategoryDto, CreateCategorySchema } from 'src/modules/categories/dto/create-category.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('categories')
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  async createCategory(@Body() createCategoryDto: CreateCategoryDto): Promise<ResponseInterface> {
    const createCategory = await this.adminService.createCategory({
      category_name: createCategoryDto.categoryName,
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
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
