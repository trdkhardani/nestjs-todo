import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import {
  ChangePasswordInput,
  DeleteUserInput,
  UpdateUserInput,
  UserInfoInput,
} from './interfaces/user.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';

type UserInfo = Prisma.UserGetPayload<{
  select: {
    user_id: true;
    user_email: true;
    user_name: true;
    user_username: true;
    user_role: true;
  };
}>;

type UserSummary = Prisma.UserGetPayload<{
  select: {
    user_id: true;
    user_name: true;
    user_username: true;
  };
}>;

type UserPassword = Prisma.UserGetPayload<{
  select: {
    user_password: true;
  };
}>;

type DeletedUser = Prisma.UserGetPayload<{
  select: {
    user_id: true;
  };
}>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async info(userInfoInput: UserInfoInput): Promise<UserInfo | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: userInfoInput.userId,
      },
      select: {
        user_id: true,
        user_email: true,
        user_name: true,
        user_username: true,
        user_role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found', {
        description: 'User not found',
      });
    }

    return user;
  }

  async updateUser(updateUserInput: UpdateUserInput): Promise<UserSummary | null> {
    const updateUser = await this.prisma.user.update({
      where: {
        user_id: updateUserInput.userId,
      },
      data: {
        user_username: updateUserInput.username,
        user_name: updateUserInput.name,
      },
      select: {
        user_id: true,
        user_name: true,
        user_username: true,
      },
    });

    if (!updateUser) {
      throw new NotFoundException('User not found', {
        description: 'User not found',
      });
    }

    return updateUser;
  }

  async changeUserPassword(changePasswordInput: ChangePasswordInput): Promise<UserSummary | null> {
    const userInfo: UserPassword | null = await this.prisma.user.findUnique({
      where: {
        user_id: changePasswordInput.userId,
      },
      select: {
        user_password: true,
      },
    });

    if (!userInfo) {
      throw new NotFoundException('User not found', {
        description: 'User not found',
      });
    }

    const verifyOldPassword = await bcrypt.compare(changePasswordInput.oldPassword, userInfo?.user_password as string);
    if (!verifyOldPassword) {
      throw new UnauthorizedException('Invalid old password.', {
        description: "Old Password from Input Don't Match with Actual Old Password",
      });
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordInput.newPassword, 10);
    return await this.prisma.user.update({
      where: {
        user_id: changePasswordInput.userId,
      },
      data: {
        user_password: hashedNewPassword,
      },
      select: {
        user_id: true,
        user_name: true,
        user_username: true,
      },
    });
  }

  async deleteUser(deleteUserInput: DeleteUserInput): Promise<DeletedUser | null> {
    const deleteUser = await this.prisma.user.delete({
      where: {
        user_id: deleteUserInput.userId,
      },
      select: {
        user_id: true,
      },
    });

    if (!deleteUser) {
      throw new NotFoundException('User not found', {
        description: 'User not found',
      });
    }

    return deleteUser;
  }
}
