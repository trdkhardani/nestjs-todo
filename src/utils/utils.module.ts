import { Module } from '@nestjs/common';
import { PlainOtpService } from './plain-otp/plain-otp.service';
import { EncryptionUtilsService } from './encryption-utils/encryption-utils.service';

@Module({
  imports: [],
  providers: [PlainOtpService, EncryptionUtilsService],
  exports: [PlainOtpService, EncryptionUtilsService],
})
export class UtilsModule {}
