import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ArchiveCollectionResponse,
  RestoreCollectionResponse,
} from '@ishraqparfums/shared';
import { CollectionStatus } from '@prisma/client';
import { CollectionRepository } from './collection.repository';
import { assertValidCollectionStatusTransition } from './collection-status-transitions';
import { toAdminCollectionResponse } from './mappers/collection.mapper';

@Injectable()
export class CollectionArchiveService {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async archive(id: string): Promise<ArchiveCollectionResponse> {
    const existing = await this.requireById(id);
    assertValidCollectionStatusTransition(
      existing.status,
      CollectionStatus.ARCHIVED,
    );

    const { collection, cascadedProductCount } =
      await this.collectionRepository.archiveWithActiveProductCascade(id);

    const hydrated =
      await this.collectionRepository.findByIdWithActiveProductCount(
        collection.id,
      );

    if (!hydrated) {
      throw new NotFoundException(`Collection with id "${id}" not found`);
    }

    return {
      collection: toAdminCollectionResponse(hydrated),
      cascadedProductCount,
    };
  }

  async restore(id: string): Promise<RestoreCollectionResponse> {
    const existing = await this.requireById(id);
    assertValidCollectionStatusTransition(
      existing.status,
      CollectionStatus.ACTIVE,
    );

    const candidates =
      await this.collectionRepository.findCollectionCascadeArchivedProducts(id);

    const restoreIds: string[] = [];
    const leaveManualIds: string[] = [];

    for (const product of candidates) {
      if (product.variants.length > 0) {
        restoreIds.push(product.id);
      } else {
        leaveManualIds.push(product.id);
      }
    }

    const collection =
      await this.collectionRepository.restoreCollectionAfterProductUpdates(
        id,
        restoreIds,
        leaveManualIds,
      );

    const hydrated =
      await this.collectionRepository.findByIdWithActiveProductCount(
        collection.id,
      );

    if (!hydrated) {
      throw new NotFoundException(`Collection with id "${id}" not found`);
    }

    return {
      collection: toAdminCollectionResponse(hydrated),
      restoredProductCount: restoreIds.length,
      leftArchivedCount: leaveManualIds.length,
    };
  }

  private async requireById(id: string) {
    const collection = await this.collectionRepository.findById(id);
    if (!collection) {
      throw new NotFoundException(`Collection with id "${id}" not found`);
    }
    return collection;
  }
}
