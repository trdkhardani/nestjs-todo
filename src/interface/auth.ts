import { FastifyRequest } from 'fastify';
import { UserRole } from 'generated/prisma/enums';

export interface JwtPayload {
  userId: string;
  userName: string;
  userRole: UserRole;
}

export interface UserPayload extends FastifyRequest {
  user: {
    userId: string;
    userName: string;
    userRole: UserRole;
  };
}
