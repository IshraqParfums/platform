import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminCollectionResponse,
  ArchiveCollectionResponse,
  CollectionSummary,
  RestoreCollectionResponse,
} from '@ishraqparfums/shared';
import { Prisma } from '@prisma/client';
import { CollectionArchiveService } from './collection-archive.service';
import { CollectionRepository } from './collection.repository';
import type {
  CreateCollectionDto,
  UpdateCollectionDto,
} from './dto/admin-collection.dto';
import {
  toAdminCollectionResponse,
  toCollectionSummary,
} from './mappers/collection.mapper';

@Injectable()
export class CollectionService {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly collectionArchiveService: CollectionArchiveService,
  ) {}

  async list(): Promise<CollectionSummary[]> {
    const collections = await this.collectionRepository.findAllActiveOrdered();
    return collections.map(toCollectionSummary);
  }

  /** Admin-curated homepage picks — filtered, ordered and capped server-side. */
  async listHomepage(): Promise<CollectionSummary[]> {
    const collections = await this.collectionRepository.findHomeRankedOrdered();
    return collections.map(toCollectionSummary);
  }

  async listAdmin(): Promise<AdminCollectionResponse[]> {
    const collections = await this.collectionRepository.findAllOrdered();
    return collections.map(toAdminCollectionResponse);
  }

  async create(input: CreateCollectionDto): Promise<AdminCollectionResponse> {
    try {
      const collection = await this.collectionRepository.create({
        name: input.name.trim(),
        slug: input.slug,
        description: input.description?.trim() ?? null,
      });

      return toAdminCollectionResponse(collection);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A collection with slug "${input.slug}" already exists`,
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateCollectionDto,
  ): Promise<AdminCollectionResponse> {
    const existing = await this.collectionRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Collection with id "${id}" not found`);
    }

    try {
      const collection = await this.collectionRepository.update(id, {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() ?? null }
          : {}),
        ...(input.homeRank !== undefined ? { homeRank: input.homeRank } : {}),
      });

      return toAdminCollectionResponse(collection);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A collection with slug "${input.slug}" already exists`,
        );
      }

      throw error;
    }
  }

  archive(id: string): Promise<ArchiveCollectionResponse> {
    return this.collectionArchiveService.archive(id);
  }

  restore(id: string): Promise<RestoreCollectionResponse> {
    return this.collectionArchiveService.restore(id);
  }
}
