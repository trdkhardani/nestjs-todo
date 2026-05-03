import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { User, Prisma } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtPayload, LoginInput, RegisterInput, WithMfaInterface } from './interfaces/auth.interface';
import { VerificationInput } from './interfaces/auth.interface';
import { CacheService } from 'src/core/cache/cache.service';
import { EmailQueueService } from 'src/core/queue/email-queue.service';
import { ConfigService } from '@nestjs/config';
import { PlainOtpService } from 'src/helpers/plain-otp/plain-otp.service';
import { createHash, randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';

// type LoginUser = Prisma.UserGetPayload<{
//   select: {
//     user_id: true;
//     user_name: true;
//     user_username: true;
//     user_password: true;
//     user_role: true;
//     user_is_verified: true;
//     user_mfa_methods: true;
//   };
// }>;
interface LoginUser {
  username: string;
  accessToken: string;
}

interface UserWithOtp extends User {
  otpCode: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private cache: CacheService,
    private plainOtpService: PlainOtpService,
    private readonly configService: ConfigService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async register(registerInput: RegisterInput): Promise<UserWithOtp> {
    const hashedPassword = await bcrypt.hash(registerInput.password, 12);
    const createUser = await this.prisma.user.create({
      data: {
        user_username: registerInput.username,
        user_name: registerInput.name,
        user_email: registerInput.email,
        user_password: hashedPassword,
      },
    });

    const otpCode = this.plainOtpService.generatePlainOtp();
    const hashedOtpCode = await bcrypt.hash(otpCode, 12);

    const redisKey = `otp:${createUser.user_id}`;
    await this.cache.set(redisKey, hashedOtpCode, 1000 * 60 * 10);

    await this.emailQueueService.addJob('send-verification-email', {
      name: createUser.user_name,
      email: createUser.user_email,
      otpCode: otpCode,
      mailerInput: {
        subject: 'Email Verification',
        template: './email-verification',
      },
    });

    return {
      ...createUser,
      otpCode,
    };
  }

  async resendVerification(email: string): Promise<{otpCode: string | null}> {
    const user = await this.prisma.user.findUnique({
      where: {
        user_email: email,
        user_is_verified: false,
      },
      select: {
        user_id: true,
        user_name: true,
        user_email: true,
      },
    });

    if (!user) {
      return {
        otpCode: null,
      };
    }

    const otpCode = this.plainOtpService.generatePlainOtp();
    const hashedOtpCode = await bcrypt.hash(otpCode, 12);

    const redisKey = `otp:${user.user_id}`;
    await this.cache.delete(redisKey);
    await this.cache.set(redisKey, hashedOtpCode, 1000 * 60 * 10);

    await this.emailQueueService.addJob('resend-verification-email', {
      name: user.user_name,
      email: user.user_email,
      otpCode: otpCode,
      mailerInput: {
        subject: 'Email Verification',
        template: './email-verification',
      },
    });

    return {
      otpCode,
    };
  }

  async verify(verificationInput: VerificationInput): Promise<User> {
    const redisKey = `otp:${verificationInput.userId}`;
    const hashedOtpCode = await this.cache.get(redisKey);
    if (!hashedOtpCode) {
      throw new UnauthorizedException('Invalid OTP Code', {
        description: 'OTP Code Invalid Caused by Expiration or Does Not Match',
      });
    }
    const isOtpCodeCorrect = await bcrypt.compare(
      verificationInput.otpCode,
      hashedOtpCode as string,
    );

    if (!isOtpCodeCorrect) {
      throw new UnauthorizedException('Invalid OTP Code', {
        description: 'OTP Code Invalid Caused by Expiration or Does Not Match',
      });
    }

    const user = await this.prisma.user.update({
      where: {
        user_id: verificationInput.userId,
      },
      data: {
        user_is_verified: true,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    await this.cache.delete(redisKey);

    return user;
  }

  async login(loginInput: LoginInput): Promise<LoginUser | WithMfaInterface> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            user_username: loginInput.username,
          },
          {
            user_email: loginInput.email,
          },
        ],
      },
      select: {
        user_id: true,
        user_name: true,
        user_email: true,
        user_username: true,
        user_password: true,
        user_role: true,
        user_is_verified: true,
        user_mfa_methods: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username/email or password.', {
        description: 'Invalid Credentials Error',
      });
    }

    if (user.user_mfa_methods.length > 0) {
      const mfaToken = randomBytes(32).toString('base64url');
      const hashedMfaToken = createHash('sha256')
        .update(mfaToken)
        .digest('hex');

      const pickedUserData = {
        userId: user.user_id,
        mfaMethods: user.user_mfa_methods,
      };

      await this.cache.set(hashedMfaToken, pickedUserData, 1000 * 60 * 3);

      return {
        mfaRequired: true,
        mfaToken,
        mfaMethods: user.user_mfa_methods,
      };
    }

    const checkPassword = await bcrypt.compare(
      loginInput.password,
      user?.user_password,
    );

    if (!checkPassword) {
      throw new UnauthorizedException('Invalid username/email or password.', {
        description: 'Invalid Credentials Error',
      });
    }

    if (!user.user_is_verified) {
      throw new UnauthorizedException('User is not verified yet', {
        description: 'User Have Not Verify Email',
      });
    }

    const payload: JwtPayload = {
      sub: user.user_id,
      username: user.user_username,
      role: user.user_role,
    };

    return {
      username: user.user_username,
      accessToken: this.jwtService.sign(payload),
    };
  }
}
