import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './core/config/configuration';
import { APP_FILTER, APP_INTERCEPTOR, RouterModule } from '@nestjs/core';
import { CatchEverythingFilter } from './common/filters/catch-everything.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/users.module';
import { TaskModule } from './modules/tasks/tasks.module';
import { CategoryModule } from './modules/categories/categories.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
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
        ],
      },
    ]),
    AuthModule,
    UserModule,
    TaskModule,
    CategoryModule,
    AdminModule,
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
  ],
})
export class AppModule {}
