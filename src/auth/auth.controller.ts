import { Controller, Post, Body, UseInterceptors, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterSchema, type RegisterDto } from 'src/dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';

@Controller()
@UsePipes(new ZodValidationPipe(RegisterSchema))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<object> {
    const hashedPassword = await bcrypt.hash(registerDto.userPassword, 10);

    const registerUser = await this.authService.register({
      user_username: registerDto.userUsername,
      user_email: registerDto.userEmail,
      user_name: registerDto.userName,
      user_password: hashedPassword,
    });

    return {
      success: true,
      data: {
        userName: registerUser.user_name,
        userUsername: registerUser.user_username,
      },
      message: 'Registration successful.',
    };
  }
}
