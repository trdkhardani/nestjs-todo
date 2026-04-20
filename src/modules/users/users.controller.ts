import { Body, Controller, Delete, Get, Patch, Req, UseGuards, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserService } from './users.service';
import type { UserPayload } from 'src/modules/auth/interfaces/auth.interface';
import { ResponseInterface } from 'src/common/interfaces/response.interface';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type UpdateUserDto, UpdateUserSchema, type ChangePasswordDto, ChangePasswordSchema } from './dto/user.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async info(@Req() req: UserPayload): Promise<ResponseInterface> {
    const userInfo = await this.userService.info(
      {
        user_id: req.user.userId,
      },
      {
        user_id: true,
        user_email: true,
        user_name: true,
        user_username: true,
        user_role: true,
      },
    );

    return {
      success: true,
      data: userInfo,
      message: 'User info retrieved successfully.',
    };
  }

  @Patch()
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  async updateUser(@Req() req: UserPayload, @Body() updateUserDto: UpdateUserDto): Promise<ResponseInterface> {
    const userUpdate = await this.userService.updateUser(
      {
        user_id: req.user.userId,
      },
      {
        user_username: updateUserDto.userUsername,
        user_name: updateUserDto.userName,
      },
    );

    return {
      success: true,
      data: {
        userUsername: userUpdate.user_username,
        userName: userUpdate.user_name,
      },
      message: 'User data updated successfully.',
    };
  }

  @Patch('/change-password')
  @UsePipes(new ZodValidationPipe(ChangePasswordSchema))
  async changeUserPassword(@Req() req: UserPayload, @Body() changePasswordDto: ChangePasswordDto): Promise<ResponseInterface> {
    const updatePassword = await this.userService.changeUserPassword({
      userId: req.user.userId,
      oldPassword: changePasswordDto.oldPassword,
      newPassword: changePasswordDto.newPassword,
    });

    return {
      success: true,
      data: {
        userUsername: updatePassword.user_username,
        userName: updatePassword.user_name,
      },
      message: 'Password changed successfully.',
    };
  }

  @Delete()
  async deleteUser(@Req() req: UserPayload): Promise<ResponseInterface> {
    const deleteUser = await this.userService.deleteUser({
      user_id: req.user.userId,
    });

    return {
      success: true,
      data: {
        userId: deleteUser.user_id,
      },
      message: 'User deleted successfully.',
    };
  }
}
