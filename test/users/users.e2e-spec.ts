import {
  Module,
  Global,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, RouterModule } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import configuration from '../../src/core/config/configuration';
import { PrismaService } from '../../src/core/database/prisma.service';
import { CatchEverythingFilter } from '../../src/common/filters/catch-everything.filter';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { AuthService } from '../../src/modules/auth/auth.service';
import { JwtStrategy } from '../../src/modules/auth/jwt.strategy';
import { UserController } from '../../src/modules/users/users.controller';
import { UserService } from '../../src/modules/users/users.service';
import { CacheService } from '../../src/core/cache/cache.service';

interface AuthFixture {
  token: string;
  userId: string;
  username: string;
  email: string;
  password: string;
  name: string;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

class InMemoryCacheService {
  private store = new Map<string, CacheEntry>();

  async get(key: string): Promise<unknown> {
    const hit = this.store.get(key);
    if (!hit) return null;

    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return hit.value;
  }

  async set(key: string, value: unknown, ttl: number = 1000 * 60 * 5): Promise<boolean> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
    return true;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
class TestDatabaseModule {}

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [],
      useFactory: () => ({
        secret: process.env.JWT_SECRET_KEY,
        signOptions: { expiresIn: '30m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
class AuthE2eModule {}

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: CacheService,
      useClass: InMemoryCacheService,
    },
  ],
})
class UsersE2eModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TestDatabaseModule,
    RouterModule.register([
      {
        path: 'api/v1',
        children: [
          {
            path: 'auth',
            module: AuthE2eModule,
          },
          {
            path: 'users',
            module: UsersE2eModule,
          },
        ],
      },
    ]),
    AuthE2eModule,
    UsersE2eModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: PinoLogger,
      useValue: {
        error: jest.fn(),
      },
    },
  ],
})
class UsersE2eAppModule {}

describe('Users Module (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let cache: InMemoryCacheService;

  const authBasePath = '/api/v1/auth';
  const usersBasePath = '/api/v1/users';
  const createdUserIds = new Set<string>();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersE2eAppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        logger: false,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
    cache = app.get(CacheService);
  });

  beforeEach(() => {
    cache.clear();
  });

  afterEach(async () => {
    if (createdUserIds.size === 0) return;

    await prisma.user.deleteMany({
      where: {
        user_id: {
          in: [...createdUserIds],
        },
      },
    });

    createdUserIds.clear();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  async function registerAndLoginUser(): Promise<AuthFixture> {
    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const username = `usr${unique}`.slice(0, 15);
    const email = `users-e2e-${unique}@example.com`;
    const password = 'password123';
    const name = `Users E2E ${unique}`;

    const registerResponse = await request(app.getHttpServer())
      .post(`${authBasePath}/register`)
      .send({
        username,
        name,
        email,
        password,
      })
      .expect(201);

    expect(registerResponse.body.success).toBe(true);

    const loginResponse = await request(app.getHttpServer())
      .post(`${authBasePath}/login`)
      .send({
        username,
        password,
      })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.accessToken).toEqual(expect.any(String));

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        user_username: username,
      },
    });

    createdUserIds.add(user.user_id);

    return {
      token: loginResponse.body.data.accessToken as string,
      userId: user.user_id,
      username,
      email,
      password,
      name,
    };
  }

  async function deleteUserDirectly(userId: string): Promise<void> {
    await prisma.user.delete({
      where: {
        user_id: userId,
      },
    });
    createdUserIds.delete(userId);
  }

  function expectNotFoundResponse(body: any): void {
    expect(body).toMatchObject({
      statusCode: 404,
      success: false,
      data: null,
    });
    expect(body.message).toEqual(expect.stringMatching(/(not found|no record found)/i));
  }

  describe(`GET ${usersBasePath}`, () => {
    it('returns user info for a valid JWT and existing user', async () => {
      const auth = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .get(usersBasePath)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(response.body).toEqual({
        statusCode: 200,
        success: true,
        data: {
          id: auth.userId,
          email: auth.email,
          name: auth.name,
          username: auth.username,
          role: 'USER',
        },
        message: 'User info retrieved successfully.',
      });
    });

    it('returns 404 when the JWT is valid but the user no longer exists', async () => {
      const auth = await registerAndLoginUser();
      await deleteUserDirectly(auth.userId);

      const response = await request(app.getHttpServer())
        .get(usersBasePath)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(404);

      expectNotFoundResponse(response.body);
    });
  });

  describe(`PATCH ${usersBasePath}`, () => {
    it('updates the current user for a valid JWT and valid payload', async () => {
      const auth = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .patch(usersBasePath)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          username: 'updatedusr123',
          name: 'Updated Name',
        })
        .expect(200);

      expect(response.body).toEqual({
        statusCode: 200,
        success: true,
        data: {
          id: auth.userId,
          username: 'updatedusr123',
          name: 'Updated Name',
        },
        message: 'User data updated successfully.',
      });

      const updatedUser = await prisma.user.findUniqueOrThrow({
        where: {
          user_id: auth.userId,
        },
      });

      expect(updatedUser.user_username).toBe('updatedusr123');
      expect(updatedUser.user_name).toBe('Updated Name');
    });

    it('returns 404 when the JWT is valid but the user no longer exists', async () => {
      const auth = await registerAndLoginUser();
      await deleteUserDirectly(auth.userId);

      const response = await request(app.getHttpServer())
        .patch(usersBasePath)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          username: 'stillvalid123',
          name: 'Still Valid Name',
        })
        .expect(404);

      expectNotFoundResponse(response.body);
    });

    it('returns 400 when username contains spaces', async () => {
      const auth = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .patch(usersBasePath)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          username: 'invalid user',
          name: 'Valid Name',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Username can not contain space',
            path: ['username'],
          }),
        ]),
      );
    });

    it('returns 413 when username exceeds the schema max length', async () => {
      const auth = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .patch(usersBasePath)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          username: 'username-more-than-15',
          name: 'Valid Name',
        })
        .expect(413);

      expect(response.body.statusCode).toBe(413);
      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_big',
            path: ['username'],
          }),
        ]),
      );
    });

    it('returns 413 when name exceeds the schema max length', async () => {
      const auth = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .patch(usersBasePath)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          username: 'validuser123',
          name: 'a'.repeat(301),
        })
        .expect(413);

      expect(response.body.statusCode).toBe(413);
      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_big',
            path: ['name'],
          }),
        ]),
      );
    });
  });

  describe(`DELETE ${usersBasePath}`, () => {
    it('deletes the current user for a valid JWT and existing user', async () => {
      const auth = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .delete(usersBasePath)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(response.body).toEqual({
        statusCode: 200,
        success: true,
        data: {
          id: auth.userId,
        },
        message: 'User deleted successfully.',
      });

      const deletedUser = await prisma.user.findUnique({
        where: {
          user_id: auth.userId,
        },
      });

      expect(deletedUser).toBeNull();
      createdUserIds.delete(auth.userId);
    });

    it('returns 404 when the JWT is valid but the user no longer exists', async () => {
      const auth = await registerAndLoginUser();
      await deleteUserDirectly(auth.userId);

      const response = await request(app.getHttpServer())
        .delete(usersBasePath)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(404);

      expectNotFoundResponse(response.body);
    });
  });

  describe(`PATCH ${usersBasePath}/change-password`, () => {
    it('changes the password for a valid JWT and valid payload', async () => {
      const auth = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .patch(`${usersBasePath}/change-password`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          oldPassword: auth.password,
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body).toEqual({
        statusCode: 200,
        success: true,
        data: {
          id: auth.userId,
          username: auth.username,
          name: auth.name,
        },
        message: 'Password changed successfully.',
      });

      await request(app.getHttpServer())
        .post(`${authBasePath}/login`)
        .send({
          username: auth.username,
          password: auth.password,
        })
        .expect(401);

      await request(app.getHttpServer())
        .post(`${authBasePath}/login`)
        .send({
          username: auth.username,
          password: 'newpassword123',
        })
        .expect(200);
    });

    it('returns 404 when the JWT is valid but the user no longer exists', async () => {
      const auth = await registerAndLoginUser();
      await deleteUserDirectly(auth.userId);

      const response = await request(app.getHttpServer())
        .patch(`${usersBasePath}/change-password`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          oldPassword: auth.password,
          newPassword: 'newpassword123',
        })
        .expect(404);

      expectNotFoundResponse(response.body);
    });

    it('returns 400 when oldPassword is shorter than 8 characters', async () => {
      const auth = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .patch(`${usersBasePath}/change-password`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          oldPassword: 'short',
          newPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_small',
            path: ['oldPassword'],
          }),
        ]),
      );
    });

    it('returns 400 when newPassword is shorter than 8 characters', async () => {
      const auth = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .patch(`${usersBasePath}/change-password`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send({
          oldPassword: auth.password,
          newPassword: 'short',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_small',
            path: ['newPassword'],
          }),
        ]),
      );
    });
  });
});
