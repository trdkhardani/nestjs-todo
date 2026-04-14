import { FastifyRequest } from 'fastify';

export interface JwtPayload {
  userId: string;
  userName: string;
}

export interface UserPayload extends FastifyRequest {
  user: {
    userId: string;
    userName: string;
  };
}
