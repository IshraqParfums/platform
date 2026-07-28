import { Controller, Get } from '@nestjs/common';
import type { CollectionSummary } from '@ishraqparfums/shared';
import { CollectionService } from './collection.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  list(): Promise<CollectionSummary[]> {
    return this.collectionService.list();
  }
}
