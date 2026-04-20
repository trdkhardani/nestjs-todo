import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { User, Prisma } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data,
    });
  }

  async login(userWhere: Prisma.UserWhereInput, userPassword: string, userSelect: Prisma.UserSelect): Promise<User | null> {
    const login = await this.prisma.user.findFirst({
      where: userWhere,
      select: userSelect,
    });

    if (!login) {
      throw new UnauthorizedException('Invalid username/email or password.', {
        description: 'Invalid Credentials Error',
      });
    }

    const checkPassword = await bcrypt.compare(userPassword, login?.user_password as string);

    if (!checkPassword) {
      throw new UnauthorizedException('Invalid username/email or password.', {
        description: 'Invalid Credentials Error',
      });
    }

    return login;
  }
}
