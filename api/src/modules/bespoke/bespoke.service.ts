import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BespokePerfumeResponse,
  BespokePreviewResponse,
  MergeBespokeResponse,
  PaginatedResponse,
  BespokeAnswerEntry,
  BespokeAxis,
  BespokeFormulaSnapshot,
} from '@ishraqparfums/shared';
import {
  BESPOKE_ENGINE_VERSION,
  computeResult,
} from '@ishraqparfums/shared';
import type { Prisma } from '@prisma/client';
import { toPaginatedResponse, toSkipTake } from '../../common/pagination';
import type {
  BespokePreviewDto,
  RenameBespokeDto,
  SaveBespokeDto,
} from './dto/bespoke.dto';
import { toBespokePerfumeResponse } from './mappers/bespoke.mapper';
import { BespokeRepository } from './bespoke.repository';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertFormulaSnapshot(value: unknown): BespokeFormulaSnapshot {
  if (!isRecord(value)) {
    throw new BadRequestException('formula must be an object');
  }
  if (!Array.isArray(value.formula)) {
    throw new BadRequestException('formula.formula must be an array');
  }
  if (typeof value.perfumeName !== 'string' || !value.perfumeName.trim()) {
    throw new BadRequestException('formula.perfumeName is required');
  }
  if (typeof value.moodPara !== 'string') {
    throw new BadRequestException('formula.moodPara must be a string');
  }
  if (!Array.isArray(value.whyItems)) {
    throw new BadRequestException('formula.whyItems must be an array');
  }
  return value as unknown as BespokeFormulaSnapshot;
}

function assertAnswers(value: unknown): BespokeAnswerEntry[] {
  if (!Array.isArray(value) || value.length < 1) {
    throw new BadRequestException('answers must be a non-empty array');
  }
  return value as BespokeAnswerEntry[];
}

@Injectable()
export class BespokeService {
  constructor(private readonly bespokeRepository: BespokeRepository) {}

  async save(
    customerId: string,
    body: SaveBespokeDto,
  ): Promise<BespokePerfumeResponse> {
    return this.persistSave(customerId, body);
  }

  async merge(
    customerId: string,
    items: SaveBespokeDto[],
  ): Promise<MergeBespokeResponse> {
    if (items.length === 0) {
      return { items: [] };
    }

    const saved: BespokePerfumeResponse[] = [];
    for (const item of items) {
      saved.push(await this.persistSave(customerId, item));
    }
    return { items: saved };
  }

  async list(
    customerId: string,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedResponse<BespokePerfumeResponse>> {
    const { skip, take, page: safePage, pageSize: safePageSize } = toSkipTake(
      page,
      pageSize,
    );

    const [rows, total] = await Promise.all([
      this.bespokeRepository.findByCustomerId(customerId, { skip, take }),
      this.bespokeRepository.countByCustomerId(customerId),
    ]);

    return toPaginatedResponse(
      rows.map(toBespokePerfumeResponse),
      total,
      safePage,
      safePageSize,
    );
  }

  async getById(
    customerId: string,
    id: string,
  ): Promise<BespokePerfumeResponse> {
    return toBespokePerfumeResponse(
      await this.requireOwned(customerId, id),
    );
  }

  async rename(
    customerId: string,
    id: string,
    body: RenameBespokeDto,
  ): Promise<BespokePerfumeResponse> {
    await this.requireOwned(customerId, id);
    const name = body.name.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }
    const updated = await this.bespokeRepository.updateName(id, name);
    return toBespokePerfumeResponse(updated);
  }

  async delete(customerId: string, id: string): Promise<void> {
    await this.requireOwned(customerId, id);
    await this.bespokeRepository.deleteOwned(id);
  }

  preview(body: BespokePreviewDto): BespokePreviewResponse {
    const answers = assertAnswers(body.answers);
    const interimRanked =
      body.interimRanked === undefined
        ? undefined
        : Array.isArray(body.interimRanked)
          ? (body.interimRanked as string[])
          : (() => {
              throw new BadRequestException('interimRanked must be an array');
            })();

    return {
      result: computeResult(answers, interimRanked as BespokeAxis[] | undefined),
      engineVersion: BESPOKE_ENGINE_VERSION,
    };
  }

  async requireOwned(customerId: string, id: string) {
    const row = await this.bespokeRepository.findById(id);
    if (!row || row.customerId !== customerId) {
      throw new NotFoundException(`Bespoke perfume with id "${id}" not found`);
    }
    return row;
  }

  private async persistSave(
    customerId: string,
    body: SaveBespokeDto,
  ): Promise<BespokePerfumeResponse> {
    const name = body.name.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }

    if (!body.engineVersion?.trim()) {
      throw new BadRequestException('engineVersion is required');
    }

    const formula = assertFormulaSnapshot(body.formula);
    const answers = assertAnswers(body.answers);

    if (typeof body.moodText !== 'string' || !body.moodText.trim()) {
      throw new BadRequestException('moodText is required');
    }
    if (!Array.isArray(body.why)) {
      throw new BadRequestException('why must be an array');
    }

    const clientKey = body.clientKey?.trim() || null;

    if (clientKey) {
      const existing = await this.bespokeRepository.findByCustomerAndClientKey(
        customerId,
        clientKey,
      );
      if (existing) {
        return toBespokePerfumeResponse(existing);
      }
    }

    try {
      const created = await this.bespokeRepository.create({
        customerId,
        name,
        formulaJson: formula as unknown as Prisma.InputJsonValue,
        answersJson: answers as unknown as Prisma.InputJsonValue,
        moodText: body.moodText,
        whyJson: body.why as unknown as Prisma.InputJsonValue,
        inspiredJson:
          body.inspired === undefined
            ? null
            : (body.inspired as Prisma.InputJsonValue),
        engineVersion: body.engineVersion.trim(),
        clientKey,
      });
      return toBespokePerfumeResponse(created);
    } catch (error) {
      // Race on unique (customerId, clientKey): re-fetch existing
      if (
        clientKey &&
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        const existing =
          await this.bespokeRepository.findByCustomerAndClientKey(
            customerId,
            clientKey,
          );
        if (existing) {
          return toBespokePerfumeResponse(existing);
        }
      }
      throw error;
    }
  }
}
