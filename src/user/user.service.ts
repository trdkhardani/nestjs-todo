import { Injectable } from '@nestjs/common';
import { Prisma, User } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async info(userWhere: Prisma.UserWhereUniqueInput, userSelect: Prisma.UserSelect): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: userWhere,
      select: userSelect,
    });
  }
}
