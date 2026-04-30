import { FastifyRequest } from 'fastify';
import { UserRole } from 'generated/prisma/enums';

export interface RegisterInput {
  username: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  username?: string;
  email?: string;
  password: string;
}

export interface VerificationInput {
  userId: string;
  otpCode: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export interface UserPayload extends FastifyRequest {
  user: {
    sub: string;
    username: string;
    role: UserRole;
  };
}
