import { Controller, Post, Body, UseInterceptors, UsePipes, UnauthorizedException, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { type LoginDto, RegisterSchema, type RegisterDto, LoginSchema } from './dto/auth.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { JwtService } from '@nestjs/jwt';
import { ResponseInterface } from 'src/common/interfaces/response.interface';
import { JwtPayload } from './interfaces/auth.interface';
import { Throttle } from '@nestjs/throttler';
import { CacheService } from 'src/core/cache/cache.service';
import { ConfigService } from '@nestjs/config';

interface RegisterData {
  userId: string;
  name: string;
  username: string;
  isVerified: boolean;
}

interface VerificationData {
  userId: string;
  name: string;
  username: string;
  isVerified: boolean;
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
    private readonly configService: ConfigService,
    private cache: CacheService,
  ) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<ResponseInterface<RegisterData>> {
    const register = await this.authService.register({
      username: registerDto.username,
      email: registerDto.email,
      name: registerDto.name,
      password: registerDto.password,
    });

    return {
      success: true,
      data: {
        userId: register.user_id,
        name: register.user_name,
        username: register.user_username,
        isVerified: register.user_is_verified,
        ...(this.configService.get<string>('nodeEnv') === 'development'
          ? { otpCode: register.otpCode }
          : {}),
      },
      message: 'Registration successful. Verification email will be sent to you',
    };
  }

  @Post('/resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string): Promise<ResponseInterface<any>> {
    const resendVerification = await this.authService.resendVerification(email);

    return {
      success: true,
      data: {
        ...(this.configService.get<string>('nodeEnv') === 'development'
          ? { otpCode: resendVerification.otpCode }
          : {}),
      },
      message: 'Verification email will be resent to you',
    };
  }

  @Post('verify/:userId')
  @HttpCode(HttpStatus.OK)
  async verify(@Param('userId') userId: string, @Body('otpCode') otpCode: string): Promise<ResponseInterface<VerificationData>> {
    const verifyEmail = await this.authService.verify({
      userId,
      otpCode,
    });

    return {
      success: true,
      data: {
        userId: verifyEmail.user_id,
        name: verifyEmail.user_name,
        username: verifyEmail.user_username,
        isVerified: verifyEmail.user_is_verified,
      },
      message: 'Verification successful',
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
    }) as any;

    if (login.mfaRequired) {
      return {
        success: true,
        data: login,
        message: 'Proceed with the MFA process',
      };
    }

    return {
      success: true,
      data: login,
      message: 'Login successful.',
    };
  }
}
