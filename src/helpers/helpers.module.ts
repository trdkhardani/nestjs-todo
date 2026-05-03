import { Module } from '@nestjs/common';
import { PlainOtpService } from './plain-otp/plain-otp.service';
import { EncryptionService } from './encryption/encryption.service';
import { OtplibTOTPService } from './otplib/otplib-totp.service';

@Module({
  imports: [],
  providers: [PlainOtpService, EncryptionService, OtplibTOTPService],
  exports: [PlainOtpService, EncryptionService, OtplibTOTPService],
})
export class HelpersModule {}
