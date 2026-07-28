import { Injectable } from '@nestjs/common';
import type { BespokePerfume, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BespokeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    customerId: string;
    name: string;
    formulaJson: Prisma.InputJsonValue;
    answersJson: Prisma.InputJsonValue;
    moodText: string;
    whyJson: Prisma.InputJsonValue;
    inspiredJson?: Prisma.InputJsonValue | null;
    engineVersion: string;
    clientKey?: string | null;
  }): Promise<BespokePerfume> {
    return this.prisma.bespokePerfume.create({
      data: {
        customerId: data.customerId,
        name: data.name,
        formulaJson: data.formulaJson,
        answersJson: data.answersJson,
        moodText: data.moodText,
        whyJson: data.whyJson,
        inspiredJson: data.inspiredJson ?? undefined,
        engineVersion: data.engineVersion,
        clientKey: data.clientKey ?? null,
      },
    });
  }

  findById(id: string): Promise<BespokePerfume | null> {
    return this.prisma.bespokePerfume.findUnique({ where: { id } });
  }

  findByCustomerAndClientKey(
    customerId: string,
    clientKey: string,
  ): Promise<BespokePerfume | null> {
    return this.prisma.bespokePerfume.findUnique({
      where: {
        customerId_clientKey: { customerId, clientKey },
      },
    });
  }

  findByCustomerId(
    customerId: string,
    options: { skip: number; take: number },
  ): Promise<BespokePerfume[]> {
    return this.prisma.bespokePerfume.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  countByCustomerId(customerId: string): Promise<number> {
    return this.prisma.bespokePerfume.count({
      where: { customerId },
    });
  }

  updateName(id: string, name: string): Promise<BespokePerfume> {
    return this.prisma.bespokePerfume.update({
      where: { id },
      data: { name },
    });
  }

  async deleteOwned(id: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { bespokePerfumeId: id },
    });
    await this.prisma.bespokePerfume.delete({ where: { id } });
  }
}
