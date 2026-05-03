import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { ResponseInterface } from 'src/common/interfaces/response.interface';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type SendEmailMfaDto, SendEmailMfaSchema, type VerifyMfaDto, VerifyMfaSchema } from '../dto/mfa.dto';

@Controller('mfa')
export class MfaController {
  constructor(
    private mfaService: MfaService,
  ) {}

  @Post('send-email')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(SendEmailMfaSchema))
  async sendMfaEmail(@Body() sendEmailMfaDto: SendEmailMfaDto): Promise<ResponseInterface<any>> {
    const sendMfaEmail = await this.mfaService.sendMfaEmail(
      sendEmailMfaDto.mfaToken,
    );

    return {
      success: true,
      data: sendMfaEmail?.otpCode,
      message: 'OTP will be sent to your email',
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(VerifyMfaSchema))
  async verifyMfa(@Body() verifyMfaDto: VerifyMfaDto): Promise<ResponseInterface<any>> {
    const verifyMfa = await this.mfaService.verifyMfa({
      mfaToken: verifyMfaDto.mfaToken,
      mfaMethod: verifyMfaDto.mfaMethod,
      code: verifyMfaDto.code,
    });

    return {
      success: true,
      data: verifyMfa,
      message: 'Login successful',
    };
  }
}
