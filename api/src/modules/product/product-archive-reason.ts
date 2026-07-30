import { BadRequestException } from '@nestjs/common';
import {
  ProductArchiveReason,
  ProductStatus,
} from '@prisma/client';

/**
 * Pure archive-reason bookkeeping. Callers still own status transitions.
 *
 * Invariant: ARCHIVED products always have a reason; non-ARCHIVED never do.
 */
export function reasonForManualArchive(): ProductArchiveReason {
  return ProductArchiveReason.MANUAL;
}

export function reasonForCollectionArchive(): ProductArchiveReason {
  return ProductArchiveReason.COLLECTION;
}

export function clearArchiveReason(): null {
  return null;
}

export function archiveReasonForStatusChange(
  nextStatus: ProductStatus,
): ProductArchiveReason | null {
  if (nextStatus === ProductStatus.ARCHIVED) {
    return reasonForManualArchive();
  }
  return clearArchiveReason();
}

/** Throws if status/reason pairing is inconsistent. */
export function assertArchiveReasonInvariant(
  status: ProductStatus,
  archiveReason: ProductArchiveReason | null,
): void {
  const isArchived = status === ProductStatus.ARCHIVED;
  const hasReason = archiveReason !== null;

  if (isArchived !== hasReason) {
    throw new BadRequestException(
      isArchived
        ? 'Archived products require an archiveReason'
        : 'archiveReason is only allowed when status is ARCHIVED',
    );
  }
}

export function isCollectionCascadeArchive(
  archiveReason: ProductArchiveReason | null,
): boolean {
  return archiveReason === ProductArchiveReason.COLLECTION;
}
