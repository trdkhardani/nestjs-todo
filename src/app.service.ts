import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async getHello(): Promise<object> {
    return {
      success: true,
      data: null,
      message: 'It works!',
    };
  }
}
