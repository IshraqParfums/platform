import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminCollectionResponse,
  ArchiveCollectionResponse,
  RestoreCollectionResponse,
} from '@ishraqparfums/shared';
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

  @Get()
  list(): Promise<AdminCollectionResponse[]> {
    return this.collectionService.listAdmin();
  }

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

  @Post(':id/archive')
  @HttpCode(200)
  archive(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ArchiveCollectionResponse> {
    return this.collectionService.archive(id);
  }

  @Post(':id/restore')
  @HttpCode(200)
  restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RestoreCollectionResponse> {
    return this.collectionService.restore(id);
  }
}
