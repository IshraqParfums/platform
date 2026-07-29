import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import type {
  AuthTokenResponse,
  RequestOtpResponse,
} from '@ishraqparfums/shared';
import { AuthService } from './auth.service';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: RefreshTokenDto): Promise<AuthTokenResponse> {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Body() body: LogoutDto): Promise<void> {
    return this.authService.logout(body.refreshToken);
  }
}
