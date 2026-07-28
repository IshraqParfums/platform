import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CustomerModule } from '../customer/customer.module';
import { JWT_EXPIRES_IN } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomerJwtGuard } from './guards/customer-jwt.guard';
import { DevLogOtpSender } from './otp/dev-log-otp.sender';
import { OtpRepository } from './otp/otp.repository';
import { OtpService } from './otp/otp.service';
import { OTP_SENDER } from './otp/otp-sender';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';

@Module({
  imports: [
    forwardRef(() => CustomerModule),
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: JWT_EXPIRES_IN,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    OtpRepository,
    CustomerJwtStrategy,
    CustomerJwtGuard,
    {
      provide: OTP_SENDER,
      useClass: DevLogOtpSender,
    },
  ],
  exports: [CustomerJwtGuard, PassportModule, JwtModule],
})
export class AuthModule {}
