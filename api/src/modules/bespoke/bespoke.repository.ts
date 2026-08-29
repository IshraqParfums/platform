import { Injectable } from '@nestjs/common';
import type { BespokePerfume, Prisma } from '@prisma/client';
import { BespokeSessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type BespokePerfumeWithCustomer = BespokePerfume & {
  customer: { id: string; name: string | null; phone: string } | null;
};

const CUSTOMER_SELECT = {
  select: { id: true, name: true, phone: true },
} as const;

@Injectable()
export class BespokeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.BespokePerfumeUncheckedCreateInput,
  ): Promise<BespokePerfume> {
    return this.prisma.bespokePerfume.create({ data });
  }

  findById(id: string): Promise<BespokePerfume | null> {
    return this.prisma.bespokePerfume.findUnique({ where: { id } });
  }

  /** Customer-facing lookup: a soft-deleted brew is gone as far as the owner is concerned. */
  findLiveOwned(
    customerId: string,
    id: string,
  ): Promise<BespokePerfume | null> {
    return this.prisma.bespokePerfume.findFirst({
      where: { id, customerId, deletedAt: null },
    });
  }

  findByCustomerAndClientKey(
    customerId: string,
    clientKey: string,
  ): Promise<BespokePerfume | null> {
    return this.prisma.bespokePerfume.findUnique({
      where: { customerId_clientKey: { customerId, clientKey } },
    });
  }

  findByCustomerId(
    customerId: string,
    options: { skip: number; take: number },
  ): Promise<BespokePerfume[]> {
    return this.prisma.bespokePerfume.findMany({
      where: {
        customerId,
        deletedAt: null,
        sessions: { some: { status: BespokeSessionStatus.CLAIMED } },
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  countByCustomerId(customerId: string): Promise<number> {
    return this.prisma.bespokePerfume.count({
      where: {
        customerId,
        deletedAt: null,
        sessions: { some: { status: BespokeSessionStatus.CLAIMED } },
      },
    });
  }

  async attachCustomer(
    perfumeId: string,
    customerId: string,
  ): Promise<BespokePerfume | null> {
    const row = await this.findById(perfumeId);
    if (!row || row.deletedAt) return null;
    if (row.customerId && row.customerId !== customerId) return null;
    if (row.customerId === customerId) return row;
    return this.prisma.bespokePerfume.update({
      where: { id: perfumeId },
      data: { customerId },
    });
  }

  updateName(id: string, name: string): Promise<BespokePerfume> {
    return this.prisma.bespokePerfume.update({
      where: { id },
      data: { name },
    });
  }

  /**
   * Soft delete: cart and order lines keep pointing at the row so history
   * stays readable — the cart simply reports the line as discontinued.
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.bespokePerfume.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  findAllForAdmin(options: {
    skip: number;
    take: number;
    includeDeleted: boolean;
    customerId?: string;
  }): Promise<BespokePerfumeWithCustomer[]> {
    return this.prisma.bespokePerfume.findMany({
      where: {
        ...(options.includeDeleted ? {} : { deletedAt: null }),
        ...(options.customerId ? { customerId: options.customerId } : {}),
      },
      include: { customer: CUSTOMER_SELECT },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  countAllForAdmin(
    includeDeleted: boolean,
    customerId?: string,
  ): Promise<number> {
    return this.prisma.bespokePerfume.count({
      where: {
        ...(includeDeleted ? {} : { deletedAt: null }),
        ...(customerId ? { customerId } : {}),
      },
    });
  }

  findByIdForAdmin(id: string): Promise<BespokePerfumeWithCustomer | null> {
    return this.prisma.bespokePerfume.findUnique({
      where: { id },
      include: { customer: CUSTOMER_SELECT },
    });
  }
}
