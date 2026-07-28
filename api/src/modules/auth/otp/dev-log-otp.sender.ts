import { Injectable, Logger } from '@nestjs/common';
import type { OtpSender } from './otp-sender';

@Injectable()
export class DevLogOtpSender implements OtpSender {
  private readonly logger = new Logger(DevLogOtpSender.name);

  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`DEV OTP for ${phone}: ${code}`);
  }
}
