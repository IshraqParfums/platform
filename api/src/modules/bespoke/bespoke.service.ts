import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BespokePerfume } from '@prisma/client';
import { BespokeSessionStatus } from '@prisma/client';
import type {
  BespokeAdminAnalytics,
  BespokeAdminListItem,
  BespokeFunnelStep,
  BespokePerfumeAdminResponse,
  BespokePerfumeCustomerResponse,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { toPaginatedResponse, toSkipTake } from '../../common/pagination';
import { BespokeRepository } from './bespoke.repository';
import { BespokeSessionRepository } from './bespoke-session.repository';
import type { RenameBespokeDto } from './dto/bespoke.dto';
import {
  hexDigestsMatch,
  sha256Hex,
} from './bespoke.helpers';
import {
  toBespokeAdminListItem,
  toBespokePerfumeAdminResponse,
  toBespokePerfumeCustomerResponse,
} from './mappers/bespoke.mapper';

const DEFAULT_ANALYTICS_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 10000;
}

@Injectable()
export class BespokeService {
  constructor(
    private readonly bespokeRepository: BespokeRepository,
    private readonly sessionRepository: BespokeSessionRepository,
  ) {}

  async list(
    customerId: string,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedResponse<BespokePerfumeCustomerResponse>> {
    const {
      skip,
      take,
      page: safePage,
      pageSize: safePageSize,
    } = toSkipTake(page, pageSize);

    const [rows, total] = await Promise.all([
      this.bespokeRepository.findByCustomerId(customerId, { skip, take }),
      this.bespokeRepository.countByCustomerId(customerId),
    ]);

    return toPaginatedResponse(
      rows.map(toBespokePerfumeCustomerResponse),
      total,
      safePage,
      safePageSize,
    );
  }

  async getById(
    customerId: string,
    id: string,
  ): Promise<BespokePerfumeCustomerResponse> {
    return toBespokePerfumeCustomerResponse(
      await this.requireOwned(customerId, id),
    );
  }

  async rename(
    customerId: string,
    id: string,
    body: RenameBespokeDto,
  ): Promise<BespokePerfumeCustomerResponse> {
    await this.requireOwned(customerId, id);
    const name = body.name.trim();

    if (!name) {
      throw new BadRequestException('name is required');
    }

    return toBespokePerfumeCustomerResponse(
      await this.bespokeRepository.updateName(id, name),
    );
  }

  async delete(customerId: string, id: string): Promise<void> {
    await this.requireOwned(customerId, id);
    await this.bespokeRepository.softDelete(id);
  }

  /** The ownership gate every purchase path goes through. Soft-deleted brews are gone. */
  async requireOwned(customerId: string, id: string): Promise<BespokePerfume> {
    const row = await this.bespokeRepository.findLiveOwned(customerId, id);

    if (!row) {
      throw new NotFoundException(`Bespoke perfume with id "${id}" not found`);
    }

    return row;
  }

  /**
   * Own it already, or attach an unowned guest brew when a matching session
   * token proves this device minted it. Does not claim into the locker.
   */
  async requireOwnedOrAttach(
    customerId: string,
    perfumeId: string,
    sessionTokens: string[],
  ): Promise<BespokePerfume> {
    const owned = await this.bespokeRepository.findLiveOwned(
      customerId,
      perfumeId,
    );
    if (owned) return owned;

    const row = await this.bespokeRepository.findById(perfumeId);
    if (!row || row.deletedAt) {
      throw new NotFoundException(
        `Bespoke perfume with id "${perfumeId}" not found`,
      );
    }
    if (row.customerId && row.customerId !== customerId) {
      throw new NotFoundException(
        `Bespoke perfume with id "${perfumeId}" not found`,
      );
    }

    const session =
      await this.sessionRepository.findByBespokePerfumeId(perfumeId);
    if (!session) {
      throw new NotFoundException(
        `Bespoke perfume with id "${perfumeId}" not found`,
      );
    }

    const tokenOk = sessionTokens.some((token) =>
      hexDigestsMatch(sha256Hex(token), session.tokenHash),
    );
    if (!tokenOk) {
      throw new NotFoundException(
        `Bespoke perfume with id "${perfumeId}" not found`,
      );
    }

    const attached = await this.bespokeRepository.attachCustomer(
      perfumeId,
      customerId,
    );
    if (!attached) {
      throw new NotFoundException(
        `Bespoke perfume with id "${perfumeId}" not found`,
      );
    }

    if (!session.customerId) {
      await this.sessionRepository.patch(session.id, session.version, {
        customerId,
      });
    }

    return attached;
  }

  async adminList(
    page?: number,
    pageSize?: number,
    includeDeleted = false,
    customerId?: string,
  ): Promise<PaginatedResponse<BespokeAdminListItem>> {
    const {
      skip,
      take,
      page: safePage,
      pageSize: safePageSize,
    } = toSkipTake(page, pageSize);

    const [rows, total] = await Promise.all([
      this.bespokeRepository.findAllForAdmin({
        skip,
        take,
        includeDeleted,
        customerId,
      }),
      this.bespokeRepository.countAllForAdmin(includeDeleted, customerId),
    ]);

    return toPaginatedResponse(
      rows.map(toBespokeAdminListItem),
      total,
      safePage,
      safePageSize,
    );
  }

  async adminGetById(id: string): Promise<BespokePerfumeAdminResponse> {
    const row = await this.bespokeRepository.findByIdForAdmin(id);

    if (!row) {
      throw new NotFoundException(`Bespoke perfume with id "${id}" not found`);
    }

    return toBespokePerfumeAdminResponse(row);
  }

  async adminAnalytics(days?: number): Promise<BespokeAdminAnalytics> {
    const rangeDays = days && days > 0 ? days : DEFAULT_ANALYTICS_DAYS;
    const since = new Date(Date.now() - rangeDays * DAY_MS);

    const [byStatus, started, answerEvents, funnel] = await Promise.all([
      this.sessionRepository.countByStatus(since),
      this.sessionRepository.countSessionsSince(since),
      this.sessionRepository.countAnswerEventsSince(since),
      this.sessionRepository.funnelSince(since),
    ]);

    const countOf = (status: BespokeSessionStatus) =>
      byStatus.find((row) => row.status === status)?.count ?? 0;

    const claimed = countOf(BespokeSessionStatus.CLAIMED);
    // A CLAIMED session has, by definition, already been completed.
    const completed = countOf(BespokeSessionStatus.COMPLETED) + claimed;

    const steps: BespokeFunnelStep[] = funnel.map((row, index) => ({
      nodeId: row.nodeId,
      nodeText: row.nodeText,
      sessions: row.sessions,
      dropOff: row.sessions - (funnel[index + 1]?.sessions ?? 0),
    }));

    return {
      rangeDays,
      sessionsStarted: started,
      sessionsActive: countOf(BespokeSessionStatus.ACTIVE),
      sessionsCompleted: completed,
      sessionsClaimed: claimed,
      sessionsExpired: countOf(BespokeSessionStatus.EXPIRED),
      completionRate: ratio(completed, started),
      claimRate: ratio(claimed, completed),
      averageQuestionsAnswered:
        started > 0 ? Math.round((answerEvents / started) * 100) / 100 : 0,
      steps,
    };
  }
}
