import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { User, Prisma } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginInput, RegisterInput } from './interfaces/auth.interface';

type LoginUser = Prisma.UserGetPayload<{
  select: {
    user_id: true;
    user_username: true;
    user_password: true;
    user_role: true;
  };
}>;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(registerInput: RegisterInput): Promise<User> {
    return await this.prisma.user.create({
      data: {
        user_username: registerInput.username,
        user_name: registerInput.name,
        user_email: registerInput.email,
        user_password: registerInput.password,
      },
    });
  }

  async login(loginInput: LoginInput): Promise<LoginUser> {
    const login = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            user_username: loginInput.username,
          },
          {
            user_email: loginInput.email,
          },
        ],
      },
      select: {
        user_id: true,
        user_username: true,
        user_password: true,
        user_role: true,
      },
    });

    if (!login) {
      throw new UnauthorizedException('Invalid username/email or password.', {
        description: 'Invalid Credentials Error',
      });
    }

    const checkPassword = await bcrypt.compare(loginInput.password, login?.user_password as string);

    if (!checkPassword) {
      throw new UnauthorizedException('Invalid username/email or password.', {
        description: 'Invalid Credentials Error',
      });
    }

    return login;
  }
}
