import { Injectable } from '@nestjs/common';
import type { CustomerRefreshToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    customerId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<CustomerRefreshToken> {
    return this.prisma.customerRefreshToken.create({ data });
  }

  findActiveByHash(tokenHash: string): Promise<CustomerRefreshToken | null> {
    return this.prisma.customerRefreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  revoke(id: string): Promise<CustomerRefreshToken> {
    return this.prisma.customerRefreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
