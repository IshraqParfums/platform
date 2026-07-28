import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AuthTokenResponse,
  RequestOtpResponse,
} from '@ishraqparfums/shared';
import { CustomerService } from '../customer/customer.service';
import { normalizeIndianPhone } from './phone/normalize-indian-phone';
import { OtpService } from './otp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly customerService: CustomerService,
    private readonly jwtService: JwtService,
  ) {}

  requestOtp(rawPhone: string): Promise<RequestOtpResponse> {
    const phone = normalizeIndianPhone(rawPhone);
    return this.otpService.requestOtp(phone);
  }

  async verifyOtp(rawPhone: string, code: string): Promise<AuthTokenResponse> {
    const phone = normalizeIndianPhone(rawPhone);

    // Guest cart / bespoke merge on login is Phase 4 — verify only issues a token here.
    await this.otpService.verifyOtp(phone, code);

    const customer = await this.customerService.upsertByPhone(phone);

    const accessToken = await this.jwtService.signAsync({
      sub: customer.id,
      role: 'customer' as const,
      phone: customer.phone,
    });

    return {
      accessToken,
      customer: this.customerService.toSummary(customer),
    };
  }
}
