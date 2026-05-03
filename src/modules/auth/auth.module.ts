import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { QueueModule } from 'src/core/queue/queue.module';
import { HelpersModule } from 'src/helpers/helpers.module';
import { MfaService } from './mfa/mfa.service';
import { MfaController } from './mfa/mfa.controller';

@Module({
  imports: [
    ConfigModule,
    HelpersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwtSecretKey'),
        signOptions: { expiresIn: '30m' },
      }),
    }),
    QueueModule,
  ],
  controllers: [AuthController, MfaController],
  providers: [AuthService, JwtStrategy, MfaService],
  exports: [AuthService, MfaService],
})
export class AuthModule {}
