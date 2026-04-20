import { Injectable } from '@nestjs/common';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { CreateCategoryInput } from './interfaces/admin.interface';

type CategorySummary = Prisma.CategoryGetPayload<{
  select: {
    category_id: true;
    category_name: true;
  };
}>;

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createCategory(createCategoryInput: CreateCategoryInput): Promise<CategorySummary> {
    return await this.prisma.category.create({
      data: {
        category_name: createCategoryInput.name,
      },
      select: {
        category_id: true,
        category_name: true,
      },
    });
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
