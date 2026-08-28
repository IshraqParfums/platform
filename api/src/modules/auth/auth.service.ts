import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AuthTokenResponse,
  RequestOtpResponse,
} from '@ishraqparfums/shared';
import type { Customer } from '@prisma/client';
import { CustomerService } from '../customer/customer.service';
import { normalizeIndianPhone } from './phone/normalize-indian-phone';
import { OtpService } from './otp/otp.service';
import { RefreshTokenService } from './refresh-token/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly customerService: CustomerService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  requestOtp(rawPhone: string): Promise<RequestOtpResponse> {
    const phone = normalizeIndianPhone(rawPhone);
    return this.otpService.requestOtp(phone);
  }

  async verifyOtp(rawPhone: string, code: string): Promise<AuthTokenResponse> {
    const phone = normalizeIndianPhone(rawPhone);

    // Guest catalog / bespoke lines merge in the shop BFF after verify.

    await this.otpService.verifyOtp(phone, code);

    const customer = await this.customerService.upsertByPhone(phone);
    return this.issueTokens(customer);
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokenResponse> {
    const rotated = await this.refreshTokenService.rotate(rawRefreshToken);
    const customer = await this.customerService.getByIdOrThrow(
      rotated.customerId,
    );

    const accessToken = await this.jwtService.signAsync({
      sub: customer.id,
      role: 'customer' as const,
      phone: customer.phone,
    });

    return {
      accessToken,
      refreshToken: rotated.token,
      customer,
    };
  }

  logout(rawRefreshToken: string): Promise<void> {
    return this.refreshTokenService.revoke(rawRefreshToken);
  }

  private async issueTokens(customer: Customer): Promise<AuthTokenResponse> {
    const [accessToken, refresh] = await Promise.all([
      this.jwtService.signAsync({
        sub: customer.id,
        role: 'customer' as const,
        phone: customer.phone,
      }),
      this.refreshTokenService.issue(customer.id),
    ]);

    return {
      accessToken,
      refreshToken: refresh.token,
      customer: this.customerService.toSummary(customer),
    };
  }
}
