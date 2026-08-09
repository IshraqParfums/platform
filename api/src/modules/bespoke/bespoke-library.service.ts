import { Injectable } from '@nestjs/common';
import type { LibraryAccordDetail, LibraryAccordSummary } from '@ishraqparfums/shared';
import {
  getLibraryAccordDetail,
  listLibraryAccordSummaries,
} from '@ishraqparfums/bespoke-engine';

/**
 * The admin Library tool's data: every accord in the library, browsable in
 * one place. Ported from Bespoke's web/admin/library — see library.ts in
 * bespoke-engine for the data assembly this delegates to.
 */
@Injectable()
export class BespokeLibraryService {
  listAccords(): LibraryAccordSummary[] {
    return listLibraryAccordSummaries();
  }

  getAccord(id: string): LibraryAccordDetail | null {
    return getLibraryAccordDetail(id);
  }
}
