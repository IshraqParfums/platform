import { Injectable } from '@nestjs/common';
import type { CollectionSummary } from '@ishraqparfums/shared';
import { CollectionRepository } from './collection.repository';
import { toCollectionSummary } from './mappers/collection.mapper';

@Injectable()
export class CollectionService {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async list(): Promise<CollectionSummary[]> {
    const collections = await this.collectionRepository.findAllOrdered();
    return collections.map(toCollectionSummary);
  }
}
