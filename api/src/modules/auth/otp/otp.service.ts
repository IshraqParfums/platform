import { createHash, randomInt } from 'crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RequestOtpResponse } from '@ishraqparfums/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OTP_MAX_PER_15_MIN,
  OTP_MAX_PER_DAY,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
} from './otp.constants';
import { throwOtpRateLimited } from './otp-rate-limit.exception';
import { OtpRepository } from './otp.repository';
import { OTP_SENDER, type OtpSender } from './otp-sender';

const WINDOW_15_MIN_MS = 15 * 60 * 1000;

@Injectable()
export class OtpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly otpRepository: OtpRepository,
    @Inject(OTP_SENDER) private readonly otpSender: OtpSender,
  ) {}

  private get pepper(): string {
    return this.configService.getOrThrow<string>('OTP_PEPPER');
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(`${this.pepper}:${code}`).digest('hex');
  }

  private generateCode(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private secondsUntil(targetMs: number): number {
    return Math.max(1, Math.ceil((targetMs - Date.now()) / 1000));
  }

  async requestOtp(phone: string): Promise<RequestOtpResponse> {
    const latest = await this.otpRepository.findLatestAny(phone);

    if (latest) {
      const elapsedMs = Date.now() - latest.createdAt.getTime();
      const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;

      if (elapsedMs < cooldownMs) {
        throwOtpRateLimited(
          'Please wait before requesting another OTP.',
          this.secondsUntil(latest.createdAt.getTime() + cooldownMs),
          'cooldown',
        );
      }
    }

    const fifteenMinutesAgo = new Date(Date.now() - WINDOW_15_MIN_MS);
    const recentCount = await this.otpRepository.countSince(
      phone,
      fifteenMinutesAgo,
    );

    if (recentCount >= OTP_MAX_PER_15_MIN) {
      const oldest = await this.otpRepository.findOldestSince(
        phone,
        fifteenMinutesAgo,
      );

      const retryAfterSeconds = oldest
        ? this.secondsUntil(oldest.createdAt.getTime() + WINDOW_15_MIN_MS)
        : this.secondsUntil(Date.now() + WINDOW_15_MIN_MS);

      throwOtpRateLimited(
        'Too many OTP requests. Try again in a few minutes.',
        retryAfterSeconds,
        'window_15m',
      );
    }

    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);
    const dayCount = await this.otpRepository.countSince(phone, startOfUtcDay);

    if (dayCount >= OTP_MAX_PER_DAY) {
      const nextUtcMidnight = new Date(startOfUtcDay);
      nextUtcMidnight.setUTCDate(nextUtcMidnight.getUTCDate() + 1);

      throwOtpRateLimited(
        'Daily OTP limit reached. Try again tomorrow.',
        this.secondsUntil(nextUtcMidnight.getTime()),
        'daily',
      );
    }

    const code = this.generateCode();
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    await this.prisma.$transaction(async (tx) => {
      await this.otpRepository.consumeAllUnconsumedForPhone(phone, tx);
      await tx.otpChallenge.create({
        data: {
          phone,
          codeHash,
          expiresAt,
        },
      });
    });

    await this.otpSender.sendOtp(phone, code);

    return {
      expiresInSeconds: OTP_TTL_SECONDS,
      resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<void> {
    const challenge = await this.otpRepository.findLatestUnconsumed(phone);

    if (!challenge) {
      const latest = await this.otpRepository.findLatestAny(phone);

      if (latest?.consumedAt) {
        throw new UnauthorizedException('OTP already used. Request a new one.');
      }

      throw new UnauthorizedException('No OTP found. Request a new one.');
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      await this.otpRepository.markConsumed(challenge.id);
      throw new UnauthorizedException('OTP expired. Request a new one.');
    }

    if (challenge.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      await this.otpRepository.markConsumed(challenge.id);
      throw new UnauthorizedException('Too many attempts. Request a new OTP.');
    }

    const expectedHash = this.hashCode(code);

    if (challenge.codeHash !== expectedHash) {
      const updated = await this.otpRepository.incrementAttempts(challenge.id);

      if (updated.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
        await this.otpRepository.markConsumed(challenge.id);
        throw new UnauthorizedException(
          'Too many attempts. Request a new OTP.',
        );
      }

      throw new UnauthorizedException('Invalid OTP.');
    }

    await this.otpRepository.markConsumed(challenge.id);
  }
}
