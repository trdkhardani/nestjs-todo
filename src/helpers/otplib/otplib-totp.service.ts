import { Injectable } from '@nestjs/common';
// import { TOTP } from 'otplib';
import { generateSecret, verify, generateURI, OTPStrategy } from 'otplib';

interface GenerateURIOptions {
  strategy?: OTPStrategy;
  issuer: string;
  label: string;
  secret: string;
}

interface VerifyOptions {
  token: string;
  secret: string;
  strategy?: OTPStrategy;
  epochTolerance?: number | [number, number];
}

@Injectable()
export class OtplibTOTPService {
  constructor() {}

  generateSecret(): string {
    return generateSecret();
  }

  generateURI(options: GenerateURIOptions): string {
    return generateURI(options);
  }

  async verify(verifyOptions: VerifyOptions): Promise<boolean> {
    return (
      await verify({
        token: verifyOptions.token,
        strategy: verifyOptions.strategy,
        epochTolerance: verifyOptions.epochTolerance,
        secret: verifyOptions.secret,
      })
    ).valid;
  }
}
