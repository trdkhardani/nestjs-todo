import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { APP_FILTER, APP_INTERCEPTOR, RouterModule } from '@nestjs/core';
import { CatchEverythingFilter } from './filter/catch-everything.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
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
        ],
      },
    ]),
    AuthModule,
    UserModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    UserService,
  ],
})
export class AppModule {}
