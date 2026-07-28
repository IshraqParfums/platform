import { Injectable } from '@nestjs/common';
import type { OtpChallenge, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    phone: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<OtpChallenge> {
    return this.prisma.otpChallenge.create({ data });
  }

  findLatestUnconsumed(phone: string): Promise<OtpChallenge | null> {
    return this.prisma.otpChallenge.findFirst({
      where: {
        phone,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatestAny(phone: string): Promise<OtpChallenge | null> {
    return this.prisma.otpChallenge.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });
  }

  countSince(phone: string, since: Date): Promise<number> {
    return this.prisma.otpChallenge.count({
      where: {
        phone,
        createdAt: { gte: since },
      },
    });
  }

  findOldestSince(phone: string, since: Date): Promise<OtpChallenge | null> {
    return this.prisma.otpChallenge.findFirst({
      where: {
        phone,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  markConsumed(id: string): Promise<OtpChallenge> {
    return this.prisma.otpChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  incrementAttempts(id: string): Promise<OtpChallenge> {
    return this.prisma.otpChallenge.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  consumeAllUnconsumedForPhone(
    phone: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Prisma.BatchPayload> {
    const client = tx ?? this.prisma;
    return client.otpChallenge.updateMany({
      where: {
        phone,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });
  }
}
