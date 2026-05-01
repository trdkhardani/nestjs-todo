import { Injectable } from '@nestjs/common';

@Injectable()
export class PlainOtpService {
  constructor() {}

  generatePlainOtp() {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
