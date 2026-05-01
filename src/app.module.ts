import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './core/config/configuration';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, RouterModule } from '@nestjs/core';
import { CatchEverythingFilter } from './common/filters/catch-everything.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/users.module';
import { TaskModule } from './modules/tasks/tasks.module';
import { CategoryModule } from './modules/categories/categories.module';
import { AdminModule } from './modules/admin/admin.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule } from './core/cache/cache.module';
import { QueueModule } from './core/queue/queue.module';
import { JobModule } from './modules/jobs/jobs.module';
import { WsModule } from './websocket/ws.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';
import { join } from 'path';
import { UtilsModule } from './utils/utils.module';
import { PlainOtpService } from './utils/plain-otp/plain-otp.service';
import { EncryptionUtilsService } from './utils/encryption-utils/encryption-utils.service';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    RouterModule.register([
      {
        path: 'api/v1',
        children: [
          {
            path: 'auth',
            module: AuthModule,
          },
          {
            path: 'user',
            module: UserModule,
          },
          {
            path: 'tasks',
            module: TaskModule,
          },
          {
            path: 'categories',
            module: CategoryModule,
          },
          {
            path: 'admin',
            module: AdminModule,
          },
          {
            path: 'jobs',
            module: JobModule,
          },
        ],
      },
    ]),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('logLevel') || 'info',
          redact: ['req.headers.authorization', 'body.password'],
          transport:
            configService.get<string>('nodeEnv') !== 'production'
              ? {
                  target: 'pino-pretty',
                }
              : undefined,
        },
      }),
    }),
    AuthModule,
    UserModule,
    TaskModule,
    CategoryModule,
    AdminModule,
    CacheModule,
    QueueModule,
    JobModule,
    WsModule,
    UtilsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    PlainOtpService,
    EncryptionUtilsService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
  ],
})
export class AppModule {}
