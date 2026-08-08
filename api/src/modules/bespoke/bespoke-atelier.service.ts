import { Injectable } from '@nestjs/common';
import { BESPOKE_DIMENSIONS, type BespokeDimension } from '@ishraqparfums/shared';
import type {
  AtelierAccordSummary,
  AtelierBootstrap,
  AtelierCataloguePerfume,
  AtelierLoadedAccord,
} from '@ishraqparfums/shared';
import {
  getAtelierChemistry,
  getAtelierMaterials,
  loadAtelierAccord,
  searchAtelierAccords,
} from '@ishraqparfums/bespoke-engine';
import { BespokeSessionRepository } from './bespoke-session.repository';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Whichever of the ten scent dimensions are present as numbers — a partial
 *  profile is still useful for the Impression panel's similarity ranking. */
function asPartialProfile(
  value: unknown,
): Partial<Record<BespokeDimension, number>> | null {
  if (!isRecord(value)) return null;
  const profile: Partial<Record<BespokeDimension, number>> = {};
  let any = false;
  for (const dimension of BESPOKE_DIMENSIONS) {
    const raw = value[dimension];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      profile[dimension] = raw;
      any = true;
    }
  }
  return any ? profile : null;
}

@Injectable()
export class BespokeAtelierService {
  constructor(private readonly sessionRepository: BespokeSessionRepository) {}

  async bootstrap(): Promise<AtelierBootstrap> {
    const materials = getAtelierMaterials();
    const chemistry = getAtelierChemistry();
    const catalogue = await this.catalogueProfiles();
    return {
      materials,
      constituents: chemistry.constituents,
      lexicon: chemistry.lexicon,
      techniqueNotes: chemistry.notes,
      noteCategories: chemistry.noteCategories,
      catalogue,
    };
  }

  searchAccords(query: string): AtelierAccordSummary[] {
    return searchAtelierAccords(query);
  }

  getAccord(id: string): AtelierLoadedAccord | null {
    return loadAtelierAccord(id);
  }

  private async catalogueProfiles(): Promise<AtelierCataloguePerfume[]> {
    const rows = await this.sessionRepository.atelierCatalogueProfiles();
    return rows.flatMap((row) => {
      const profile = asPartialProfile(row.scentProfileJson);
      if (!profile) return [];
      return [
        {
          id: row.id,
          name: row.name,
          collection: row.collection?.name,
          profile,
        },
      ];
    });
  }
}
