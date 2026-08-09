import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import type { LibraryAccordDetail, LibraryAccordSummary } from '@ishraqparfums/shared';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { BespokeLibraryService } from './bespoke-library.service';

/**
 * The admin Library tool: every accord in the library, browsable in one
 * place. Ported from Bespoke's web/app/admin/library — see
 * bespoke-library.service.ts.
 */
@Controller('admin/bespoke/library')
@UseGuards(AdminJwtGuard)
export class AdminBespokeLibraryController {
  constructor(private readonly libraryService: BespokeLibraryService) {}

  @Get('accords')
  listAccords(): LibraryAccordSummary[] {
    return this.libraryService.listAccords();
  }

  @Get('accords/:id')
  getAccord(@Param('id') id: string): LibraryAccordDetail {
    const accord = this.libraryService.getAccord(id);
    if (!accord) throw new NotFoundException(`Unknown accord: "${id}"`);
    return accord;
  }
}
