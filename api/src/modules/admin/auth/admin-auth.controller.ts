import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { AdminAuthTokenResponse } from '@ishraqparfums/shared';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import type { RequestWithAdmin } from '../types/request-with-admin';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshTokenDto } from './dto/admin-refresh-token.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: AdminLoginDto): Promise<AdminAuthTokenResponse> {
    return this.adminAuthService.login(body.email, body.password);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: AdminRefreshTokenDto): Promise<AdminAuthTokenResponse> {
    return this.adminAuthService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AdminJwtGuard)
  logout(
    @Req() request: RequestWithAdmin,
    @Body() body: AdminRefreshTokenDto,
  ): Promise<void> {
    const header = request.headers.authorization;
    const accessToken = header?.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : undefined;

    if (!accessToken) {
      throw new UnauthorizedException('Unauthorized.');
    }

    return this.adminAuthService.logout(accessToken, body.refreshToken);
  }
}
