import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import type {
  AuthTokenResponse,
  RequestOtpResponse,
} from '@ishraqparfums/shared';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(200)
  requestOtp(@Body() body: RequestOtpDto): Promise<RequestOtpResponse> {
    return this.authService.requestOtp(body.phone);
  }

  @Post('otp/verify')
  @HttpCode(200)
  verifyOtp(@Body() body: VerifyOtpDto): Promise<AuthTokenResponse> {
    return this.authService.verifyOtp(body.phone, body.code);
  }
}
