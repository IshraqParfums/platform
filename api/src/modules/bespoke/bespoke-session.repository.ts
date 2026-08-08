import { Injectable } from '@nestjs/common';
import type { BespokePerfume, BespokeSession, Product } from '@prisma/client';
import { BespokeSessionStatus, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type BespokeQuizEventInput = {
  type: string;
  nodeId: string;
  nodeText: string;
  optionIds?: string[];
  optionLabels?: string[];
};

/** Fields a session write may touch; `version` is bumped by the repository. */
export type BespokeSessionPatch = {
  stateJson?: Prisma.InputJsonValue;
  historyJson?: Prisma.InputJsonValue;
  shortlistJson?: Prisma.InputJsonValue | null;
  resultJson?: Prisma.InputJsonValue | null;
  status?: BespokeSessionStatus;
  customerId?: string | null;
  bespokePerfumeId?: string | null;
};

export type BespokeFunnelRow = {
  nodeId: string;
  nodeText: string;
  sessions: number;
};

export type BespokeStatusCountRow = {
  status: BespokeSessionStatus;
  count: number;
};

function toUpdateData(
  patch: BespokeSessionPatch,
): Prisma.BespokeSessionUncheckedUpdateManyInput {
  const data: Prisma.BespokeSessionUncheckedUpdateManyInput = {
    version: { increment: 1 },
  };

  if (patch.stateJson !== undefined) data.stateJson = patch.stateJson;
  if (patch.historyJson !== undefined) data.historyJson = patch.historyJson;
  if (patch.shortlistJson !== undefined) {
    data.shortlistJson = patch.shortlistJson ?? Prisma.DbNull;
  }
  if (patch.resultJson !== undefined) {
    data.resultJson = patch.resultJson ?? Prisma.DbNull;
  }
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.customerId !== undefined) data.customerId = patch.customerId;
  if (patch.bespokePerfumeId !== undefined) {
    data.bespokePerfumeId = patch.bespokePerfumeId;
  }

  return data;
}

@Injectable()
export class BespokeSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    tokenHash: string;
    customerId: string | null;
    stateJson: Prisma.InputJsonValue;
    expiresAt: Date;
    ipHash: string | null;
  }): Promise<BespokeSession> {
    return this.prisma.bespokeSession.create({
      data: {
        tokenHash: data.tokenHash,
        customerId: data.customerId,
        stateJson: data.stateJson,
        historyJson: [],
        expiresAt: data.expiresAt,
        ipHash: data.ipHash,
      },
    });
  }

  findById(id: string): Promise<BespokeSession | null> {
    return this.prisma.bespokeSession.findUnique({ where: { id } });
  }

  countRecentByIpHash(ipHash: string, since: Date): Promise<number> {
    return this.prisma.bespokeSession.count({
      where: { ipHash, createdAt: { gte: since } },
    });
  }

  countActiveByCustomer(customerId: string): Promise<number> {
    return this.prisma.bespokeSession.count({
      where: { customerId, status: BespokeSessionStatus.ACTIVE },
    });
  }

  /** Expire the oldest ACTIVE session for a customer (FIFO for the concurrent cap). */
  async expireOldestActiveForCustomer(customerId: string): Promise<void> {
    const oldest = await this.prisma.bespokeSession.findFirst({
      where: { customerId, status: BespokeSessionStatus.ACTIVE },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!oldest) return;
    await this.markExpired(oldest.id);
  }

  /**
   * Compare-and-set on `version`: returns the refreshed row, or null when
   * another request advanced the session first.
   */
  async patch(
    id: string,
    expectedVersion: number,
    patch: BespokeSessionPatch,
  ): Promise<BespokeSession | null> {
    const result = await this.prisma.bespokeSession.updateMany({
      where: { id, version: expectedVersion },
      data: toUpdateData(patch),
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markExpired(id: string): Promise<void> {
    await this.prisma.bespokeSession.updateMany({
      where: { id, status: BespokeSessionStatus.ACTIVE },
      data: { status: BespokeSessionStatus.EXPIRED },
    });
  }

  async recordEvent(
    sessionId: string,
    event: BespokeQuizEventInput,
  ): Promise<void> {
    await this.prisma.bespokeQuizEvent.create({
      data: {
        sessionId,
        type: event.type,
        nodeId: event.nodeId,
        nodeText: event.nodeText,
        optionIds: event.optionIds ?? [],
        optionLabels: event.optionLabels ?? [],
      },
    });
  }

  /**
   * Completing an owned session mints the brew and points the session at it
   * in one write, so a session can never end up COMPLETED with a result the
   * customer has no row for.
   */
  async completeWithBrew(
    id: string,
    expectedVersion: number,
    patch: BespokeSessionPatch,
    brew: Prisma.BespokePerfumeUncheckedCreateInput,
  ): Promise<{ session: BespokeSession; brew: BespokePerfume }> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.bespokePerfume.create({ data: brew });
      const result = await tx.bespokeSession.updateMany({
        where: { id, version: expectedVersion },
        data: toUpdateData({ ...patch, bespokePerfumeId: created.id }),
      });

      if (result.count === 0) {
        throw new BespokeSessionVersionConflict();
      }

      const session = await tx.bespokeSession.findUniqueOrThrow({
        where: { id },
      });
      return { session, brew: created };
    });
  }

  referenceProducts(): Promise<
    Pick<Product, 'id' | 'name' | 'slug' | 'scentProfileJson'>[]
  > {
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        scentProfileJson: { not: Prisma.DbNull },
      },
      select: { id: true, name: true, slug: true, scentProfileJson: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * The retail catalogue's scent profiles, for the Atelier bench's "what
   * have I already made that is near this" panel — same profile source as
   * referenceProducts(), with the collection name a perfumer would recognise
   * a bottle by.
   */
  atelierCatalogueProfiles(): Promise<
    {
      id: string;
      name: string;
      scentProfileJson: Prisma.JsonValue;
      collection: { name: string } | null;
    }[]
  > {
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        scentProfileJson: { not: Prisma.DbNull },
      },
      select: {
        id: true,
        name: true,
        scentProfileJson: true,
        collection: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findProductProfile(
    id: string,
  ): Promise<Pick<Product, 'id' | 'name' | 'scentProfileJson'> | null> {
    return this.prisma.product.findFirst({
      where: { id, status: ProductStatus.ACTIVE },
      select: { id: true, name: true, scentProfileJson: true },
    });
  }

  countByStatus(since: Date): Promise<BespokeStatusCountRow[]> {
    return this.prisma.$queryRaw<BespokeStatusCountRow[]>`
      SELECT s."status"::text AS "status", COUNT(*)::int AS "count"
      FROM "bespoke_sessions" s
      WHERE s."createdAt" >= ${since}
      GROUP BY s."status"
    `;
  }

  countSessionsSince(since: Date): Promise<number> {
    return this.prisma.bespokeSession.count({
      where: { createdAt: { gte: since } },
    });
  }

  countAnswerEventsSince(since: Date): Promise<number> {
    return this.prisma.bespokeQuizEvent.count({
      where: { type: 'answer', at: { gte: since } },
    });
  }

  /** Distinct sessions that answered each node — the raw funnel, widest first. */
  funnelSince(since: Date): Promise<BespokeFunnelRow[]> {
    return this.prisma.$queryRaw<BespokeFunnelRow[]>`
      SELECT
        e."nodeId" AS "nodeId",
        MIN(e."nodeText") AS "nodeText",
        COUNT(DISTINCT e."sessionId")::int AS "sessions"
      FROM "bespoke_quiz_events" e
      WHERE e."type" = 'answer' AND e."at" >= ${since}
      GROUP BY e."nodeId"
      ORDER BY MIN(e."at") ASC, e."nodeId" ASC
    `;
  }

  async pruneAbandonedSessions(before: Date): Promise<number> {
    const result = await this.prisma.bespokeSession.deleteMany({
      where: {
        bespokePerfumeId: null,
        status: {
          in: [
            BespokeSessionStatus.ACTIVE,
            BespokeSessionStatus.EXPIRED,
            BespokeSessionStatus.COMPLETED,
          ],
        },
        updatedAt: { lt: before },
      },
    });
    return result.count;
  }

  async pruneEvents(before: Date): Promise<number> {
    const result = await this.prisma.bespokeQuizEvent.deleteMany({
      where: { at: { lt: before } },
    });
    return result.count;
  }
}

/** Thrown inside the completion transaction so the brew insert rolls back. */
export class BespokeSessionVersionConflict extends Error {
  constructor() {
    super('Bespoke session was modified concurrently');
    this.name = 'BespokeSessionVersionConflict';
  }
}
