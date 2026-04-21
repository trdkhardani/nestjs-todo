import { Controller, Post, Body, UseInterceptors, UsePipes, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { type LoginDto, RegisterSchema, type RegisterDto, LoginSchema } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { JwtService } from '@nestjs/jwt';
import { ResponseInterface } from 'src/common/interfaces/response.interface';
import { JwtPayload } from './interfaces/auth.interface';
import { Throttle } from '@nestjs/throttler';

interface RegisterData {
  name: string;
  username: string;
}

interface LoginData {
  username: string;
  accessToken: string;
}

@Throttle({
  default: {
    ttl: 60000,
    limit: 5,
  },
})
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<ResponseInterface<RegisterData>> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const register = await this.authService.register({
      username: registerDto.username,
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
    });

    return {
      success: true,
      data: {
        name: register.user_name,
        username: register.user_username,
      },
      message: 'Registration successful.',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<ResponseInterface<LoginData>> {
    const login = await this.authService.login({
      username: loginDto.username,
      email: loginDto.email,
      password: loginDto.password,
    });

    const payload: JwtPayload = {
      sub: login?.user_id,
      username: login?.user_username,
      role: login?.user_role,
    };

    return {
      success: true,
      data: {
        username: login?.user_username,
        accessToken: this.jwtService.sign(payload),
      },
      message: 'Login successful.',
    };
  }
}
