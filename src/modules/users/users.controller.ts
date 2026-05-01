import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserService } from './users.service';
import type { UserPayload } from 'src/modules/auth/interfaces/auth.interface';
import { ResponseInterface } from 'src/common/interfaces/response.interface';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type UpdateUserDto, UpdateUserSchema, type ChangePasswordDto, ChangePasswordSchema, ActivateMfaSchema, type ActivateMfaDto, VerifyMfaSchema, type VerifyMfaDto } from './dto/user.dto';
import { CacheService } from 'src/core/cache/cache.service';

interface UserInfoData {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
}

interface UserSummaryData {
  id: string;
  name: string;
  username: string;
}

interface DeleteUserData {
  id: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService, private cache: CacheService) {}

  @Get()
  async info(@Req() req: UserPayload): Promise<ResponseInterface<UserInfoData>> {
    const redisKey = `cache:users:${req.user.sub}:info`;
    const cachedValue = await this.cache.get(redisKey);
    if (cachedValue) {
      return cachedValue as Promise<ResponseInterface<UserInfoData>>;
    }

    const userInfo = await this.userService.info({
      userId: req.user.sub,
    });

    const response = {
      success: true,
      data: {
        id: userInfo!.user_id,
        email: userInfo!.user_email,
        name: userInfo!.user_name,
        username: userInfo!.user_username,
        role: userInfo!.user_role,
      },
      message: 'User info retrieved successfully.',
    };
    await this.cache.set(redisKey, response);
    return response;
  }

  @Patch()
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  async updateUser(@Req() req: UserPayload, @Body() updateUserDto: UpdateUserDto): Promise<ResponseInterface<UserSummaryData>> {
    const userUpdate = await this.userService.updateUser({
      userId: req.user.sub,
      username: updateUserDto.username,
      name: updateUserDto.name,
    });

    await this.cache.delete(`cache:users:${req.user.sub}:info`);

    return {
      success: true,
      data: {
        id: userUpdate!.user_id,
        username: userUpdate!.user_username,
        name: userUpdate!.user_name,
      },
      message: 'User data updated successfully.',
    };
  }

  @Post('/mfa-activation')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ActivateMfaSchema))
  async activateMfa(@Req() req: UserPayload, @Body() activateMfaDto: ActivateMfaDto): Promise<ResponseInterface<object>> {
    const activateMfa = await this.userService.activateMfa({
      userId: req.user.sub,
      mfaMethod: activateMfaDto.mfaMethod,
    });

    return {
      success: true,
      data: {
        token: activateMfa.token,
      },
      message:
        activateMfaDto.mfaMethod === 'AUTHENTICATOR_APP_TOTP'
          ? 'Scan the QR Code with your Authenticator App'
          : 'OTP Code will be sent to you',
    };
  }

  @Patch('/mfa-verification')
  @UsePipes(new ZodValidationPipe(VerifyMfaSchema))
  async verifyMfa(@Req() req: UserPayload, @Body() verifyMfaDto: VerifyMfaDto): Promise<ResponseInterface<object>> {
    const verifyMfa = await this.userService.verifyMfa({
      userId: req.user.sub,
      mfaMethod: verifyMfaDto.mfaMethod,
      otpCode: verifyMfaDto.otpCode,
    });

    return {
      success: true,
      data: {
        id: verifyMfa.user_id,
        username: verifyMfa.user_username,
        name: verifyMfa.user_name,
        mfaMethod: verifyMfa.user_mfa_methods,
      },
      message: 'MFA successfully activated',
    };
  }

  @Patch('/change-password')
  @UsePipes(new ZodValidationPipe(ChangePasswordSchema))
  async changeUserPassword(@Req() req: UserPayload, @Body() changePasswordDto: ChangePasswordDto): Promise<ResponseInterface<UserSummaryData>> {
    const updatePassword = await this.userService.changeUserPassword({
      userId: req.user.sub,
      oldPassword: changePasswordDto.oldPassword,
      newPassword: changePasswordDto.newPassword,
    });

    return {
      success: true,
      data: {
        id: updatePassword!.user_id,
        username: updatePassword!.user_username,
        name: updatePassword!.user_name,
      },
      message: 'Password changed successfully.',
    };
  }

  @Delete()
  async deleteUser(@Req() req: UserPayload): Promise<ResponseInterface<DeleteUserData>> {
    const deleteUser = await this.userService.deleteUser({
      userId: req.user.sub,
    });

    return {
      success: true,
      data: {
        id: deleteUser!.user_id,
      },
      message: 'User deleted successfully.',
    };
  }
}
