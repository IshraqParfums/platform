import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AdminCollectionResponse } from '@ishraqparfums/shared';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { CollectionService } from './collection.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
} from './dto/admin-collection.dto';

@Controller('admin/collections')
@UseGuards(AdminJwtGuard)
export class AdminCollectionsController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post()
  create(@Body() body: CreateCollectionDto): Promise<AdminCollectionResponse> {
    return this.collectionService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCollectionDto,
  ): Promise<AdminCollectionResponse> {
    return this.collectionService.update(id, body);
  }
}
