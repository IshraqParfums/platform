import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import type {
  AtelierAccordSummary,
  AtelierBootstrap,
  AtelierLoadedAccord,
} from '@ishraqparfums/shared';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { BespokeAtelierService } from './bespoke-atelier.service';
import { AdminAtelierAccordSearchQueryDto } from './dto/bespoke.dto';

/**
 * The Atelier bench tool's data: the material palette, chemistry reference,
 * retail catalogue profiles, and accord library search/load. Ported from
 * Bespoke's web/app/admin/atelier — see bespoke-atelier.service.ts.
 */
@Controller('admin/bespoke/atelier')
@UseGuards(AdminJwtGuard)
export class AdminBespokeAtelierController {
  constructor(private readonly atelierService: BespokeAtelierService) {}

  @Get('bootstrap')
  bootstrap(): Promise<AtelierBootstrap> {
    return this.atelierService.bootstrap();
  }

  @Get('accords')
  searchAccords(
    @Query() query: AdminAtelierAccordSearchQueryDto,
  ): AtelierAccordSummary[] {
    return this.atelierService.searchAccords(query.q ?? '');
  }

  @Get('accords/:id')
  getAccord(@Param('id') id: string): AtelierLoadedAccord {
    const accord = this.atelierService.getAccord(id);
    if (!accord) throw new NotFoundException(`Unknown accord: "${id}"`);
    return accord;
  }
}
