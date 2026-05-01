import { ConflictException, Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import {
  ActivateMfaInput,
  ChangePasswordInput,
  DeleteUserInput,
  UpdateUserInput,
  UserInfoInput,
} from './interfaces/user.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { generateSecret, generate, verify, generateURI } from "otplib";
import qrcode from 'qrcode';
import { CacheService } from 'src/core/cache/cache.service';
import { EmailQueueService } from '../../core/queue/email-queue.service';
import { ConfigService } from '@nestjs/config';
import { VerifyMfaInput } from './interfaces/user.interface';
import { PlainOtpService } from 'src/utils/plain-otp/plain-otp.service';
import { EncryptionUtilsService } from 'src/utils/encryption-utils/encryption-utils.service';

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

// interface EncryptionProps {
//   encryptedData: Base64URLString;
//   iv: Base64URLString;
//   tag: Base64URLString
// }

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private emailQueueService: EmailQueueService,
    private configService: ConfigService,
    private plainOtpService: PlainOtpService,
    private encryptionUtilsService: EncryptionUtilsService,
  ) {}

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

  async updateUser(
    updateUserInput: UpdateUserInput,
  ): Promise<UserSummary | null> {
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

  async activateMfa(
    activateMfaInput: ActivateMfaInput,
  ): Promise<{ token: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: activateMfaInput.userId,
      },
      select: {
        user_id: true,
        user_email: true,
        user_name: true,
        user_mfa_methods: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found', {
        description: 'User not found',
      });
    }

    const redisKey = `otp:MFA:temp:${activateMfaInput.mfaMethod}:${user.user_id}`;

    if (activateMfaInput.mfaMethod === 'AUTHENTICATOR_APP_TOTP') {
      const hasAuthenticatorTotp = user.user_mfa_methods.find(
        (mfaMethod) => mfaMethod === 'AUTHENTICATOR_APP_TOTP',
      );
      if (hasAuthenticatorTotp) {
        throw new ConflictException(
          'Cannot set Authenticator App MFA because MFA using Authenticator App has already been activated',
          {
            description:
              'User Has Already Activated the AUTHENTICATOR_APP_TOTP MFA method',
          },
        );
      }

      const secret = generateSecret();
      const encryptSecret = this.encryptionUtilsService.encrypt(secret);

      await this.cache.set(redisKey, encryptSecret, 1000 * 60 * 3);

      const uri = generateURI({
        strategy: 'totp',
        issuer: 'NestJS ToDo App',
        label: user.user_email,
        secret,
      });

      const qrCode = await qrcode.toDataURL(uri);

      return {
        token: qrCode,
      };
    }

    const hasEmailBasedOtp = user.user_mfa_methods.find(
      (mfaMethod) => mfaMethod === 'EMAIL_BASED_OTP',
    );
    if (hasEmailBasedOtp) {
      throw new ConflictException(
        'Cannot set MFA using Email because Email MFA has already been activated',
        {
          description:
            'User Has Already Activated the EMAIL_BASED_OTP MFA method',
        },
      );
    }

    const otpCode = this.plainOtpService.generatePlainOtp();
    const hashedOtpCode = await bcrypt.hash(otpCode, 12);
    await this.cache.set(redisKey, hashedOtpCode, 1000 * 60 * 3);

    await this.emailQueueService.addJob('', {
      name: user.user_name,
      email: user.user_email,
      otpCode: otpCode,
      mailerInput: {
        subject: 'Multi-Factor Authentication Activation',
        template: './mfa-activation',
      },
    });

    return {
      token:
        this.configService.get<string>('nodeEnv') === 'development'
          ? otpCode
          : null,
    };
  }

  async verifyMfa(verifyMfaInput: VerifyMfaInput) {
    const redisKey = `otp:MFA:temp:${verifyMfaInput.mfaMethod}:${verifyMfaInput.userId}`;
    const tempCode = await this.cache.get(redisKey) as any;

    if (!tempCode) {
      throw new UnprocessableEntityException('Invalid OTP', {
        description:
          'Invalid OTP Because of Expired/Deleted Secret (Authenticator App) or Hashed OTP Code (Email-Based)',
      });
    }

    if (verifyMfaInput.mfaMethod === 'AUTHENTICATOR_APP_TOTP') {
      const decryptedSecret = this.encryptionUtilsService.decrypt({
        iv: tempCode.iv,
        encryptedData: tempCode.encryptedData,
        tag: tempCode.tag,
      });

      const verifyAuthenticatorOtpCode = await verify({
        secret: decryptedSecret,
        strategy: 'totp',
        token: verifyMfaInput.otpCode,
      });

      if (!verifyAuthenticatorOtpCode.valid) {
        throw new UnprocessableEntityException(
          'Invalid OTP. Check your authenticator app again or request for MFA again.',
          {
            description:
              'Invalid OTP Because of Invalid, Expired Secret, Or Malformed.',
          },
        );
      }

      await this.cache.delete(redisKey);

      return await this.prisma.user.update({
        where: {
          user_id: verifyMfaInput.userId,
        },
        data: {
          user_mfa_methods: {
            push: 'AUTHENTICATOR_APP_TOTP',
          },
          totp: {
            create: {
              totp_enabled: true,
              totp_secret: tempCode.encryptedData // encrypted secret
            },
          },
        },
      });
    }

    const verifyOtpCode = await bcrypt.compare(
      verifyMfaInput.otpCode,
      tempCode,
    );

    if (!verifyOtpCode) {
      throw new UnprocessableEntityException('Invalid OTP', {
        description:
          'Invalid OTP Because of Invalid, Expired Hashed OTP, Or Malformed.',
      });
    }

    await this.cache.delete(redisKey);

    return await this.prisma.user.update({
      where: {
        user_id: verifyMfaInput.userId,
      },
      data: {
        user_mfa_methods: {
          push: 'EMAIL_BASED_OTP',
        },
      },
    });
  }

  async changeUserPassword(
    changePasswordInput: ChangePasswordInput,
  ): Promise<UserSummary | null> {
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

    const verifyOldPassword = await bcrypt.compare(
      changePasswordInput.oldPassword,
      userInfo?.user_password as string,
    );
    if (!verifyOldPassword) {
      throw new UnauthorizedException('Invalid old password.', {
        description:
          "Old Password from Input Don't Match with Actual Old Password",
      });
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordInput.newPassword,
      10,
    );
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

  async deleteUser(
    deleteUserInput: DeleteUserInput,
  ): Promise<DeletedUser | null> {
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
