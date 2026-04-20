import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, User } from 'generated/prisma/client';
import { ChangePasswordInterface } from './interfaces/user.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async info(userWhere: Prisma.UserWhereUniqueInput, userSelect: Prisma.UserSelect): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: userWhere,
      select: userSelect,
    });
  }

  async updateUser(userWhere: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput): Promise<User> {
    return await this.prisma.user.update({
      where: userWhere,
      data,
    });
  }

  async changeUserPassword(changePassInterface: ChangePasswordInterface): Promise<User> {
    const userInfo = await this.info(
      {
        user_id: changePassInterface.userId,
      },
      {
        user_password: true,
      },
    );

    const verifyOldPassword = await bcrypt.compare(changePassInterface.oldPassword, userInfo?.user_password as string);
    if (!verifyOldPassword) {
      throw new UnauthorizedException('Invalid old password.', {
        description: "Old Password from Input Don't Match with Actual Old Password",
      });
    }

    const hashedNewPassword = await bcrypt.hash(changePassInterface.newPassword, 10);
    return await this.updateUser(
      {
        user_id: changePassInterface.userId,
      },
      {
        user_password: hashedNewPassword,
      },
    );
  }

  async deleteUser(userWhere: Prisma.UserWhereUniqueInput): Promise<User> {
    return await this.prisma.user.delete({
      where: userWhere,
    });
  }
}
