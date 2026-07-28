import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminCollectionResponse,
  CollectionSummary,
} from '@ishraqparfums/shared';
import { Prisma } from '@prisma/client';
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
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async list(): Promise<CollectionSummary[]> {
    const collections = await this.collectionRepository.findAllOrdered();
    return collections.map(toCollectionSummary);
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
}
