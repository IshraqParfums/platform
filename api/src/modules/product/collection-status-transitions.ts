import { BadRequestException } from '@nestjs/common';
import { CollectionStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<CollectionStatus, CollectionStatus[]> = {
  [CollectionStatus.ACTIVE]: [CollectionStatus.ARCHIVED],
  [CollectionStatus.ARCHIVED]: [CollectionStatus.ACTIVE],
};

export function assertValidCollectionStatusTransition(
  from: CollectionStatus,
  to: CollectionStatus,
): void {
  if (from === to) {
    throw new BadRequestException(
      `Collection is already ${from}`,
    );
  }

  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(
      `Cannot change collection status from ${from} to ${to}`,
    );
  }
}
