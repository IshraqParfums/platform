import { Controller, Get, Query } from '@nestjs/common';
import type { CollectionSummary } from '@ishraqparfums/shared';
import { CollectionService } from './collection.service';
import { ListCollectionsQueryDto } from './dto/list-collections.query.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  list(@Query() query: ListCollectionsQueryDto): Promise<CollectionSummary[]> {
    return query.homepage
      ? this.collectionService.listHomepage()
      : this.collectionService.list();
  }
}
