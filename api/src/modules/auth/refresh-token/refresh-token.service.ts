import { randomBytes, createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { REFRESH_TOKEN_TTL_DAYS } from './refresh-token.constants';
import { RefreshTokenRepository } from './refresh-token.repository';

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

export interface RotatedRefreshToken extends IssuedRefreshToken {
  customerId: string;
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issue(customerId: string): Promise<IssuedRefreshToken> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.refreshTokenRepository.create({
      customerId,
      tokenHash: this.hash(token),
      expiresAt,
    });

    return { token, expiresAt };
  }

  async rotate(rawToken: string): Promise<RotatedRefreshToken> {
    const existing = await this.refreshTokenRepository.findActiveByHash(
      this.hash(rawToken),
    );

    if (!existing) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepository.revoke(existing.id);
    const issued = await this.issue(existing.customerId);

    return { ...issued, customerId: existing.customerId };
  }

  async revoke(rawToken: string): Promise<void> {
    const existing = await this.refreshTokenRepository.findActiveByHash(
      this.hash(rawToken),
    );

    if (!existing) {
      return;
    }

    await this.refreshTokenRepository.revoke(existing.id);
  }
}
