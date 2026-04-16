import { Controller, Post, Body, UseInterceptors, UsePipes, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { type LoginDto, RegisterSchema, type RegisterDto, LoginSchema } from 'src/dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { JwtService } from '@nestjs/jwt';
import { ResponseInterface } from 'src/interface/response';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() registerDto: RegisterDto): Promise<ResponseInterface> {
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() loginDto: LoginDto): Promise<ResponseInterface> {
    const login = await this.authService.login(
      {
        OR: [
          {
            user_username: loginDto.userUsername,
          },
          {
            user_email: loginDto.userEmail,
          },
        ],
      },
      {
        user_id: true,
        user_name: true,
        user_password: true,
      },
    );

    if (!login) {
      throw new UnauthorizedException('Invalid username/email or password.', {
        description: 'Invalid Credentials Error',
      });
    }

    const checkPassword = await bcrypt.compare(loginDto.userPassword, login?.user_password as string);

    if (!checkPassword) {
      throw new UnauthorizedException('Invalid username/email or password.', {
        description: 'Invalid Credentials Error',
      });
    }

    const payload = {
      userId: login?.user_id,
      userName: login?.user_name,
    };

    return {
      success: true,
      data: {
        userName: login?.user_name,
        accessToken: this.jwtService.sign(payload),
      },
      message: 'Login successful.',
    };
  }
}
