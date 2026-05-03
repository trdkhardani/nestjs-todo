import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CacheService } from 'src/core/cache/cache.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { EmailQueueService } from 'src/core/queue/email-queue.service';
import { VerifyMfaInput } from '../interfaces/mfa.interface';
import { createHash } from 'crypto';
import { PlainOtpService } from 'src/helpers/plain-otp/plain-otp.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from 'src/helpers/encryption/encryption.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/auth.interface';
import { OtplibTOTPService } from 'src/helpers/otplib/otplib-totp.service';

@Injectable()
export class MfaService {
  constructor(
    private prisma: PrismaService,
    private redis: CacheService,
    private emailQueueService: EmailQueueService,
    private plainOtpService: PlainOtpService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    private totpService: OtplibTOTPService,
    private jwtService: JwtService,
  ) {}

  async sendMfaEmail(mfaToken: string) {
    const hashedMfaToken = createHash('sha256').update(mfaToken).digest('hex');
    const storedValue = await this.redis.get(hashedMfaToken) as any;

    if (!storedValue) {
      throw new UnprocessableEntityException();
    }

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: storedValue.userId,
      },
      select: {
        user_id: true,
        user_email: true,
        user_name: true,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    await this.redis.delete(hashedMfaToken);

    const otpCode = this.plainOtpService.generatePlainOtp();
    const hashedOtpCode = await bcrypt.hash(otpCode, 12);
    const valueToStore = {
      userId: user.user_id,
      hashedOtpCode,
    };

    await this.redis.set(hashedMfaToken, valueToStore, 1000 * 60 * 3);

    await this.emailQueueService.addJob('send-mfa-login', {
      name: user.user_name,
      email: user.user_email,
      otpCode: otpCode,
      mailerInput: {
        subject: 'Login Multi-Factor Authentication',
        template: './mfa-login',
      },
    });

    return this.configService.get<string>('nodeEnv') === 'development'
      ? { otpCode: otpCode }
      : null;
  }

  async verifyMfa(verifyMfaInput: VerifyMfaInput) {
    const hashedMfaToken = createHash('sha256')
      .update(verifyMfaInput.mfaToken)
      .digest('hex');
    const storedValue = await this.redis.get(hashedMfaToken) as any;

    if (!storedValue) {
      throw new UnprocessableEntityException('Invalid OTP', {
        description:
          'No key found in redis that matched with hashedMfaToken from the input',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: storedValue.userId,
      },
      select: {
        user_id: true,
        user_email: true,
        user_username: true,
        user_name: true,
        user_role: true,
        totp: {
          select: {
            totp_secret_ciphertext: true,
            totp_secret_iv: true,
            totp_secret_tag: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found', {
        description: 'No Corresponding User Found',
      });
    }

    const payload: JwtPayload = {
      sub: user.user_id,
      username: user.user_username,
      role: user.user_role,
    };

    if (verifyMfaInput.mfaMethod === 'AUTHENTICATOR_APP_TOTP') {
      const decryptedSecret = this.encryptionService.decrypt({
        iv: user.totp!.totp_secret_iv,
        encryptedData: user.totp!.totp_secret_ciphertext,
        tag: user.totp!.totp_secret_tag,
      });

      const verifyCode = await this.totpService.verify({
        strategy: 'totp',
        secret: decryptedSecret,
        token: verifyMfaInput.code,
        epochTolerance: [30, 0], // 30 secs tolerance (roughly first previous old code can be used)
      });

      if (!verifyCode) {
        throw new UnprocessableEntityException('Invalid OTP', {
          description: 'OTP Code Is Invalid',
        });
      }

      await this.prisma.totp.update({
        where: {
          user_id: user.user_id,
        },
        data: {
          totp_last_used: new Date(),
        },
      });

      await this.redis.delete(hashedMfaToken);

      return {
        username: user.user_username,
        accessToken: this.jwtService.sign(payload),
      };
    }

    const verifyOtpCodeFromEmail = await bcrypt.compare(
      verifyMfaInput.code,
      storedValue.hashedOtpCode,
    );

    if (!verifyOtpCodeFromEmail) {
      throw new UnprocessableEntityException('Invalid OTP', {
        description:
          'OTP Is Invalid Because of the Entried OTP Code Does Not Matched with Hashed OTP Code',
      });
    }

    await this.redis.delete(hashedMfaToken);

    return {
      username: user.user_username,
      accessToken: this.jwtService.sign(payload),
    };
  }
}
