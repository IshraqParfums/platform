import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MAX_CATALOG_LINE_QUANTITY,
  PRODUCT_LIST_SORT_DEFAULT,
  isUrduScript,
  type AdminLowStockVariant,
  type AdminProductDetail,
  type AdminProductImage,
  type AdminProductListItem,
  type AdminProductVariant,
  type PaginatedResponse,
  type ProductDetail,
  type ProductFaqItem,
  type ProductListItem,
  type ProductListSort,
  type ProductMeaningStory,
  type ProductNoteList,
  type ProductNotesPyramid,
} from '@ishraqparfums/shared';
import type { ProductVariant } from '@prisma/client';
import {
  CollectionStatus,
  Prisma,
  ProductArchiveReason,
  ProductStatus,
} from '@prisma/client';
import { toPaginatedResponse, toSkipTake } from '../../common/pagination';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildRatingSummaryMap } from '../review/rating-summary';
import { CollectionRepository } from './collection.repository';
import type { AdminListProductsQueryDto } from './dto/admin-list-products.query.dto';
import type {
  CreateProductDto,
  UpdateProductDto,
} from './dto/admin-product.dto';
import type { AdjustStockDto } from './dto/adjust-stock.dto';
import type {
  CreateVariantDto,
  UpdateVariantDto,
} from './dto/admin-variant.dto';
import type { CreateImageDto, UpdateImageDto } from './dto/admin-image.dto';
import type {
  ProductWithCatalogRelations,
  PurchasableVariantWithProduct,
} from './mappers/product.mapper';
import {
  toAdminImage,
  toAdminProductDetail,
  toAdminProductListItem,
  toAdminVariant,
  toProductDetail,
  toProductListItem,
} from './mappers/product.mapper';
import {
  archiveReasonForStatusChange,
  isCollectionCascadeArchive,
  reasonForCollectionArchive,
} from './product-archive-reason';
import { assertValidProductStatusTransition } from './product-status-transitions';
import { ProductRepository } from './product.repository';
import { isVariantSellable } from './variant-availability';

type DbClient = Prisma.TransactionClient | PrismaService;

/**
 * The admin form posts an empty string when the field is cleared, and the DTO
 * lets it through (a @MinLength there would make clearing impossible). Collapse
 * empty/whitespace to null so the column only ever holds a real name — the
 * storefront renders the Urdu block on a plain null check.
 */
function normalizeNameUrdu(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function requireUrduIfPresent(
  value: string | null,
  label: string,
): string | null {
  if (!value) return null;
  if (!isUrduScript(value)) {
    throw new BadRequestException(`${label} must be written in Urdu.`);
  }
  return value;
}

function requireUrduListIfPresent(
  value: string[] | null,
  label: string,
): string[] | null {
  if (!value || value.length === 0) return value;
  for (const item of value) {
    if (item.trim() && !isUrduScript(item)) {
      throw new BadRequestException(`${label} must be written in Urdu.`);
    }
  }
  return value;
}

function assertPdpUrdu(input: {
  nameUrdu?: string | null;
  taglineTranslation?: string | null;
  meaningStory?: ProductMeaningStory | null;
  notesPyramid?: ProductNotesPyramid | null;
}) {
  requireUrduIfPresent(input.nameUrdu ?? null, "Urdu name");
  requireUrduIfPresent(input.taglineTranslation ?? null, "Tagline Urdu");
  requireUrduListIfPresent(
    input.meaningStory?.bodyTranslation ?? null,
    "Story translation",
  );
  const pyramid = input.notesPyramid;
  if (pyramid) {
    requireUrduListIfPresent(
      pyramid.opening?.notesTranslation ?? null,
      "Opening notes Urdu",
    );
    requireUrduListIfPresent(
      pyramid.heart?.notesTranslation ?? null,
      "Heart notes Urdu",
    );
    requireUrduListIfPresent(
      pyramid.base?.notesTranslation ?? null,
      "Base notes Urdu",
    );
  }
}

/**
 * Shared trim/empty-to-null implementation backing every PDP scalar-string
 * `normalizeXxx` helper below — same rule as `normalizeNameUrdu`: the admin
 * form posts "" to clear a field, this collapses that (and whitespace-only
 * input) down to null so the column only ever holds real content or null.
 */
function normalizeOptionalString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const normalizePronunciation = normalizeOptionalString;
const normalizeMeaning = normalizeOptionalString;
const normalizeTaglinePrimary = normalizeOptionalString;
const normalizeTaglineTranslation = normalizeOptionalString;
const normalizeScentFamily = normalizeOptionalString;
const normalizeFormatLabel = normalizeOptionalString;
const normalizeConcentration = normalizeOptionalString;
const normalizeApplication = normalizeOptionalString;
const normalizeBottleDescription = normalizeOptionalString;

/** Trims each entry and drops blank/whitespace-only ones. Always returns an
 *  array (never undefined/null) — matches the `String[] @default([])` columns. */
function normalizeStringList(value: string[] | undefined): string[] {
  if (!value) return [];
  return value.map((item) => item.trim()).filter((item) => item.length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item): item is string => typeof item === 'string')) {
    return null;
  }
  return value;
}

/**
 * Whitelist parsers for the three `Json?` PDP columns. Raw JSON isn't
 * type-checked by class-validator decorators, so these are the actual safety
 * net before anything reaches Prisma — same "trust nothing from the raw
 * value, check known keys, drop everything else" pattern as
 * `asFingerprint`/`asPartialProfile` in the bespoke module. Any input that
 * doesn't match the expected shape collapses to `null` rather than throwing
 * — PDP content is progressively authored, so a malformed/partial submission
 * just doesn't get saved instead of hard-failing the whole request.
 */
function asNoteList(value: unknown): ProductNoteList | null {
  if (!isRecord(value)) return null;
  const notes = asStringArray(value.notes);
  if (!notes) return null;
  return { notes, notesTranslation: asStringArray(value.notesTranslation) };
}

function asMeaningStory(value: unknown): ProductMeaningStory | null {
  if (!isRecord(value)) return null;
  if (typeof value.heading !== 'string') return null;
  const body = asStringArray(value.body);
  if (!body) return null;
  return {
    heading: value.heading,
    body,
    bodyTranslation: asStringArray(value.bodyTranslation),
  };
}

function asNotesPyramid(value: unknown): ProductNotesPyramid | null {
  if (!isRecord(value)) return null;
  const opening = asNoteList(value.opening);
  const heart = asNoteList(value.heart);
  const base = asNoteList(value.base);
  if (!opening && !heart && !base) return null;
  return { opening, heart, base };
}

function asFaqList(value: unknown): ProductFaqItem[] | null {
  if (!Array.isArray(value)) return null;
  const items: ProductFaqItem[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    if (typeof raw.question !== 'string' || typeof raw.answer !== 'string') {
      continue;
    }
    const question = raw.question.trim();
    const answer = raw.answer.trim();
    if (!question || !answer) continue;
    items.push({ question, answer });
  }
  return items.length > 0 ? items : null;
}

/**
 * `ProductMeaningStory`/`ProductNotesPyramid`/`ProductFaqItem[]` are plain
 * JSON-serializable values and satisfy Prisma's `InputJsonValue` structurally,
 * but that type requires an index signature TS can't infer from a named
 * interface — hence the cast here rather than at every call site. `null`
 * becomes `Prisma.DbNull`, the sentinel Prisma requires to write a real SQL
 * NULL into a `Json?` column (same convention as `resultJson` elsewhere).
 */
function toJsonColumn(value: object | null) {
  return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  availableQty(
    variant: Pick<ProductVariant, 'stockQty' | 'reservedQty'>,
  ): number {
    return Math.max(0, variant.stockQty - variant.reservedQty);
  }

  async list(
    collectionSlug?: string,
    page?: number,
    pageSize?: number,
    q?: string,
    sort?: ProductListSort,
  ): Promise<PaginatedResponse<ProductListItem>> {
    let collectionId: string | undefined;

    if (collectionSlug !== undefined) {
      const collection =
        await this.collectionRepository.findActiveBySlug(collectionSlug);

      if (!collection) {
        throw new NotFoundException(
          `Collection with slug "${collectionSlug}" not found`,
        );
      }

      collectionId = collection.id;
    }

    const {
      skip,
      take,
      page: safePage,
      pageSize: safePageSize,
    } = toSkipTake(page, pageSize);

    const listOptions = {
      collectionId,
      search: q,
      sort: sort ?? PRODUCT_LIST_SORT_DEFAULT,
      skip,
      take,
    };

    const [products, total] = await Promise.all([
      this.productRepository.findActiveMany(listOptions),
      this.productRepository.countActive({
        collectionId,
        search: q,
      }),
    ]);

    const productIds = products.map((product) => product.id);
    const ratingRows =
      productIds.length === 0
        ? []
        : await this.prisma.review.groupBy({
            by: ['productId'],
            where: { productId: { in: productIds } },
            _avg: { rating: true },
            _count: { rating: true },
          });
    const ratings = buildRatingSummaryMap(productIds, ratingRows);

    const items = products.map((product) => {
      const summary = ratings.get(product.id);
      return toProductListItem(
        product,
        summary?.ratingAverage ?? null,
        summary?.reviewCount ?? 0,
      );
    });

    return toPaginatedResponse(items, total, safePage, safePageSize);
  }

  async getBySlug(slug: string): Promise<ProductDetail> {
    const product = await this.requireVisibleBySlug(slug);
    const ratingRows = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const summary = buildRatingSummaryMap([product.id], ratingRows).get(
      product.id,
    );

    return toProductDetail(
      product,
      summary?.ratingAverage ?? null,
      summary?.reviewCount ?? 0,
    );
  }

  async requireActiveBySlug(
    slug: string,
  ): Promise<ProductWithCatalogRelations> {
    const product = await this.productRepository.findActiveBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  /** ACTIVE or ARCHIVED — used for PDP so archived cart links don't 404. */
  async requireVisibleBySlug(
    slug: string,
  ): Promise<ProductWithCatalogRelations> {
    const product = await this.productRepository.findVisibleBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async findPurchasableVariant(
    variantId: string,
  ): Promise<PurchasableVariantWithProduct> {
    const variant =
      await this.productRepository.findVariantByIdWithProduct(variantId);

    if (!variant) {
      throw new NotFoundException(`Variant with id "${variantId}" not found`);
    }

    this.assertVariantPurchasable(variant);
    return variant;
  }

  async findPurchasableVariants(
    variantIds: string[],
  ): Promise<Map<string, PurchasableVariantWithProduct>> {
    const uniqueIds = [...new Set(variantIds)];
    const variants =
      await this.productRepository.findVariantsByIdsWithProduct(uniqueIds);
    const byId = new Map(variants.map((variant) => [variant.id, variant]));

    for (const id of uniqueIds) {
      const variant = byId.get(id);
      if (!variant) {
        throw new NotFoundException(`Variant with id "${id}" not found`);
      }
      this.assertVariantPurchasable(variant);
    }

    return byId;
  }

  /**
   * Stock + price gate for cart writes — no images.
   */
  async findPurchasableVariantLean(variantId: string): Promise<{
    id: string;
    sizeMl: number;
    pricePaise: number;
    stockQty: number;
    reservedQty: number;
    isAvailable: boolean;
  }> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        sizeMl: true,
        pricePaise: true,
        stockQty: true,
        reservedQty: true,
        isAvailable: true,
        product: { select: { status: true, name: true } },
      },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with id "${variantId}" not found`);
    }

    this.assertVariantPurchasable(variant);
    return variant;
  }

  private assertVariantPurchasable(variant: {
    sizeMl: number;
    stockQty: number;
    reservedQty: number;
    isAvailable: boolean;
    product: { status: ProductStatus; name: string };
  }): void {
    if (variant.product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        "This fragrance isn't available to buy right now.",
      );
    }

    if (!variant.isAvailable) {
      throw new BadRequestException("That size isn't available right now.");
    }

    if (this.availableQty(variant) < 1) {
      throw new BadRequestException('That size is out of stock.');
    }
  }

  assertQuantityAvailable(
    variant: Pick<
      PurchasableVariantWithProduct,
      'stockQty' | 'reservedQty' | 'sizeMl'
    >,
    quantity: number,
  ): void {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const available = this.availableQty(variant);

    if (quantity > available) {
      throw new BadRequestException(
        `Only ${available} unit(s) of ${variant.sizeMl}ml in stock`,
      );
    }

    // Kept distinct from the stock check above: "out of stock" and "per-order
    // limit" have different remedies, so the customer must be told which.
    this.assertWithinLineLimit(quantity, variant.sizeMl);
  }

  /**
   * Per-order ceiling, independent of how much stock is on hand.
   *
   * Takes no variant so callers holding only a cart row (the `/cart` stepper,
   * whose stock check lives in SQL) can enforce the cap without a extra read.
   */
  assertWithinLineLimit(quantity: number, sizeMl?: number | null): void {
    if (quantity <= MAX_CATALOG_LINE_QUANTITY) return;

    throw new BadRequestException(
      sizeMl != null
        ? `Limit ${MAX_CATALOG_LINE_QUANTITY} bottles of ${sizeMl}ml per order`
        : `Limit ${MAX_CATALOG_LINE_QUANTITY} bottles per size, per order`,
    );
  }

  /**
   * Stock/availability check for cart qty updates — lean select, no images.
   */
  async assertVariantQuantityForCart(
    variantId: string,
    quantity: number,
  ): Promise<void> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        stockQty: true,
        reservedQty: true,
        isAvailable: true,
        sizeMl: true,
        product: { select: { status: true, name: true } },
      },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with id "${variantId}" not found`);
    }

    if (variant.product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        "This fragrance isn't available to buy right now.",
      );
    }

    if (!variant.isAvailable) {
      throw new BadRequestException("That size isn't available right now.");
    }

    this.assertQuantityAvailable(variant, quantity);
  }

  /**
   * Read-then-write on `stockQty`/`reservedQty` is not safe under concurrent
   * checkouts — two requests can both read the same `available` and both
   * pass, oversubscribing the last unit. The actual write is therefore a
   * single atomic `UPDATE ... WHERE` that re-checks the same condition it
   * writes against, matching `CartRepository.updateOwnedItemQuantity`'s
   * pattern for computed comparisons (no `SELECT ... FOR UPDATE` anywhere in
   * this codebase; atomic conditional writes are the established style).
   * The `findUnique` above the write is kept only to produce the existing
   * "Only N units in stock" message before attempting the write.
   */
  async reserveStock(
    variantId: string,
    quantity: number,
    db: DbClient = this.prisma,
  ): Promise<void> {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with id "${variantId}" not found`);
    }

    const available = this.availableQty(variant);

    if (quantity > available) {
      throw new BadRequestException(
        `Only ${available} unit(s) of ${variant.sizeMl}ml in stock`,
      );
    }

    const reserved = await db.$queryRaw<{ id: string }[]>`
      UPDATE product_variants
      SET "reservedQty" = "reservedQty" + ${quantity}
      WHERE id = ${variantId}
        AND ("stockQty" - "reservedQty") >= ${quantity}
      RETURNING id
    `;

    if (reserved.length === 0) {
      // Lost the race between the check above and this write — stock moved
      // in between. Same message shape as the upfront check.
      throw new BadRequestException(
        `Only ${available} unit(s) of ${variant.sizeMl}ml in stock`,
      );
    }
  }

  /** Atomic — see the note on `reserveStock`. Preserves the previous clamp-to-zero behaviour. */
  async releaseReservation(
    variantId: string,
    quantity: number,
    db: DbClient = this.prisma,
  ): Promise<void> {
    if (quantity < 1) {
      return;
    }

    const released = await db.$queryRaw<{ id: string }[]>`
      UPDATE product_variants
      SET "reservedQty" = GREATEST(0, "reservedQty" - ${quantity})
      WHERE id = ${variantId}
      RETURNING id
    `;

    if (released.length === 0) {
      throw new NotFoundException(`Variant with id "${variantId}" not found`);
    }
  }

  /**
   * Atomic — see the note on `reserveStock`. The guard here is a simple
   * (non-computed) comparison, so `updateMany`'s `where` expresses it
   * directly rather than needing raw SQL, matching
   * `OrderRepository.tryClaimPendingAsExpired`'s pattern.
   * count === 0 is ambiguous (missing row vs insufficient reservation);
   * a follow-up lookup restores NotFound vs BadRequest.
   */
  async commitReservation(
    variantId: string,
    quantity: number,
    db: DbClient = this.prisma,
  ): Promise<void> {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const result = await db.productVariant.updateMany({
      where: {
        id: variantId,
        reservedQty: { gte: quantity },
        stockQty: { gte: quantity },
      },
      data: {
        stockQty: { decrement: quantity },
        reservedQty: { decrement: quantity },
      },
    });

    if (result.count === 0) {
      const exists = await db.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException(
          `Variant with id "${variantId}" not found`,
        );
      }
      throw new BadRequestException(
        `Cannot commit reservation for variant ${variantId}`,
      );
    }
  }

  // --- Admin: products ---

  async listAdmin(
    query: AdminListProductsQueryDto,
  ): Promise<PaginatedResponse<AdminProductListItem>> {
    const { skip, take, page, pageSize } = toSkipTake(
      query.page,
      query.pageSize,
    );
    const filters = {
      status: query.status,
      collectionId: query.collectionId,
      search: query.search,
    };

    const [products, total] = await Promise.all([
      this.productRepository.findAdminMany({ filters, skip, take }),
      this.productRepository.countAdmin(filters),
    ]);

    return toPaginatedResponse(
      products.map(toAdminProductListItem),
      total,
      page,
      pageSize,
    );
  }

  async listLowStock(threshold: number): Promise<AdminLowStockVariant[]> {
    const rows = await this.productRepository.findLowStockVariants(threshold);
    return rows.map((row) => ({
      productId: row.product.id,
      productName: row.product.name,
      variantId: row.id,
      sizeMl: row.sizeMl,
      stockQty: row.stockQty,
      reservedQty: row.reservedQty,
    }));
  }

  async getAdminById(id: string): Promise<AdminProductDetail> {
    const product = await this.requireAdminById(id);
    return toAdminProductDetail(product);
  }

  async createProduct(input: CreateProductDto): Promise<AdminProductDetail> {
    const collection = await this.collectionRepository.findById(
      input.collectionId,
    );

    if (!collection) {
      throw new BadRequestException(
        `Collection with id "${input.collectionId}" not found`,
      );
    }

    const nextStatus = input.status ?? ProductStatus.DRAFT;
    this.assertCanPlaceActiveProduct(collection.status, nextStatus);

    if (nextStatus === ProductStatus.ACTIVE) {
      this.assertActivatable([], 0);
    }

    assertPdpUrdu({
      nameUrdu: normalizeNameUrdu(input.nameUrdu),
      taglineTranslation: normalizeTaglineTranslation(input.taglineTranslation),
      meaningStory: asMeaningStory(input.meaningStory),
      notesPyramid: asNotesPyramid(input.notesPyramid),
    });

    try {
      const product = await this.productRepository.create({
        collection: { connect: { id: input.collectionId } },
        name: input.name.trim(),
        nameUrdu: normalizeNameUrdu(input.nameUrdu),
        slug: input.slug,
        shortDescription: input.shortDescription.trim(),
        status: nextStatus,
        archiveReason: archiveReasonForStatusChange(nextStatus),
        pronunciation: normalizePronunciation(input.pronunciation),
        meaning: normalizeMeaning(input.meaning),
        taglinePrimary: normalizeTaglinePrimary(input.taglinePrimary),
        taglineTranslation: normalizeTaglineTranslation(
          input.taglineTranslation,
        ),
        meaningStoryJson: toJsonColumn(asMeaningStory(input.meaningStory)),
        notesPyramidJson: toJsonColumn(asNotesPyramid(input.notesPyramid)),
        scentFamily: normalizeScentFamily(input.scentFamily),
        characterTags: normalizeStringList(input.characterTags),
        intensity: input.intensity ?? null,
        sillage: input.sillage ?? null,
        longevity: input.longevity ?? null,
        season: normalizeStringList(input.season),
        occasion: normalizeStringList(input.occasion),
        gender: input.gender ?? null,
        formatLabel: normalizeFormatLabel(input.formatLabel),
        concentration: normalizeConcentration(input.concentration),
        application: normalizeApplication(input.application),
        bottleDescription: normalizeBottleDescription(input.bottleDescription),
        faqJson: toJsonColumn(asFaqList(input.faq)),
      });

      return toAdminProductDetail(product);
    } catch (error) {
      throw this.mapProductSlugConflict(error, input.slug);
    }
  }

  async updateProduct(
    id: string,
    input: UpdateProductDto,
  ): Promise<AdminProductDetail> {
    const current = await this.requireAdminById(id);
    this.assertMutable(current);

    const destinationCollectionId =
      input.collectionId !== undefined
        ? input.collectionId
        : current.collectionId;

    const destinationCollection =
      destinationCollectionId === current.collectionId
        ? current.collection
        : await this.collectionRepository.findById(destinationCollectionId);

    if (!destinationCollection) {
      throw new BadRequestException(
        `Collection with id "${destinationCollectionId}" not found`,
      );
    }

    let nextStatus = input.status ?? current.status;
    let nextArchiveReason = current.archiveReason;

    if (input.status !== undefined) {
      assertValidProductStatusTransition(current.status, input.status);

      if (
        input.status === ProductStatus.ACTIVE &&
        current.status !== ProductStatus.ACTIVE
      ) {
        this.assertActivatable(current.variants, current.images.length);
      }

      nextStatus = input.status;
      nextArchiveReason = archiveReasonForStatusChange(input.status);
    }

    const collectionChanged =
      input.collectionId !== undefined &&
      input.collectionId !== current.collectionId;

    if (collectionChanged) {
      const move = this.resolveMoveAfterCollectionChange({
        currentStatus: nextStatus,
        currentArchiveReason: nextArchiveReason,
        destinationStatus: destinationCollection.status,
        variants: current.variants,
        statusExplicitlySet: input.status !== undefined,
      });
      nextStatus = move.status;
      nextArchiveReason = move.archiveReason;
    }

    this.assertCanPlaceActiveProduct(destinationCollection.status, nextStatus);

    assertPdpUrdu({
      nameUrdu: normalizeNameUrdu(input.nameUrdu),
      taglineTranslation: normalizeTaglineTranslation(input.taglineTranslation),
      meaningStory: asMeaningStory(input.meaningStory),
      notesPyramid: asNotesPyramid(input.notesPyramid),
    });

    try {
      const product = await this.productRepository.update(id, {
        ...(input.collectionId !== undefined
          ? { collection: { connect: { id: input.collectionId } } }
          : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.nameUrdu !== undefined
          ? { nameUrdu: normalizeNameUrdu(input.nameUrdu) }
          : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.shortDescription !== undefined
          ? { shortDescription: input.shortDescription.trim() }
          : {}),
        status: nextStatus,
        archiveReason: nextArchiveReason,
        ...(input.pronunciation !== undefined
          ? { pronunciation: normalizePronunciation(input.pronunciation) }
          : {}),
        ...(input.meaning !== undefined
          ? { meaning: normalizeMeaning(input.meaning) }
          : {}),
        ...(input.taglinePrimary !== undefined
          ? { taglinePrimary: normalizeTaglinePrimary(input.taglinePrimary) }
          : {}),
        ...(input.taglineTranslation !== undefined
          ? {
              taglineTranslation: normalizeTaglineTranslation(
                input.taglineTranslation,
              ),
            }
          : {}),
        ...(input.meaningStory !== undefined
          ? {
              meaningStoryJson: toJsonColumn(
                asMeaningStory(input.meaningStory),
              ),
            }
          : {}),
        ...(input.notesPyramid !== undefined
          ? {
              notesPyramidJson: toJsonColumn(
                asNotesPyramid(input.notesPyramid),
              ),
            }
          : {}),
        ...(input.scentFamily !== undefined
          ? { scentFamily: normalizeScentFamily(input.scentFamily) }
          : {}),
        ...(input.characterTags !== undefined
          ? { characterTags: normalizeStringList(input.characterTags) }
          : {}),
        ...(input.intensity !== undefined
          ? { intensity: input.intensity }
          : {}),
        ...(input.sillage !== undefined ? { sillage: input.sillage } : {}),
        ...(input.longevity !== undefined
          ? { longevity: input.longevity }
          : {}),
        ...(input.season !== undefined
          ? { season: normalizeStringList(input.season) }
          : {}),
        ...(input.occasion !== undefined
          ? { occasion: normalizeStringList(input.occasion) }
          : {}),
        ...(input.gender !== undefined ? { gender: input.gender } : {}),
        ...(input.formatLabel !== undefined
          ? { formatLabel: normalizeFormatLabel(input.formatLabel) }
          : {}),
        ...(input.concentration !== undefined
          ? { concentration: normalizeConcentration(input.concentration) }
          : {}),
        ...(input.application !== undefined
          ? { application: normalizeApplication(input.application) }
          : {}),
        ...(input.bottleDescription !== undefined
          ? {
              bottleDescription: normalizeBottleDescription(
                input.bottleDescription,
              ),
            }
          : {}),
        ...(input.faq !== undefined
          ? { faqJson: toJsonColumn(asFaqList(input.faq)) }
          : {}),
      });

      return toAdminProductDetail(product);
    } catch (error) {
      throw this.mapProductSlugConflict(error, input.slug);
    }
  }

  /**
   * Moving a COLLECTION-cascaded product off its collection clears that mark.
   * Destination ACTIVE → try live again; destination ARCHIVED → stay cascaded.
   */
  private resolveMoveAfterCollectionChange(input: {
    currentStatus: ProductStatus;
    currentArchiveReason: ProductArchiveReason | null;
    destinationStatus: CollectionStatus;
    variants: Array<
      Pick<ProductVariant, 'isAvailable' | 'stockQty' | 'reservedQty'>
    >;
    statusExplicitlySet: boolean;
  }): {
    status: ProductStatus;
    archiveReason: ProductArchiveReason | null;
  } {
    if (!isCollectionCascadeArchive(input.currentArchiveReason)) {
      return {
        status: input.currentStatus,
        archiveReason: input.currentArchiveReason,
      };
    }

    if (input.destinationStatus === CollectionStatus.ARCHIVED) {
      return {
        status: ProductStatus.ARCHIVED,
        archiveReason: reasonForCollectionArchive(),
      };
    }

    // Leaving an archived collection for an ACTIVE one.
    if (input.statusExplicitlySet) {
      // Caller already chose the next status; only clear COLLECTION reason.
      return {
        status: input.currentStatus,
        archiveReason: archiveReasonForStatusChange(input.currentStatus),
      };
    }

    if (input.variants.some(isVariantSellable)) {
      return {
        status: ProductStatus.ACTIVE,
        archiveReason: null,
      };
    }

    // No sellable sizes yet — park as draft rather than a manual archive.
    return {
      status: ProductStatus.DRAFT,
      archiveReason: null,
    };
  }

  private assertCanPlaceActiveProduct(
    collectionStatus: CollectionStatus,
    productStatus: ProductStatus,
  ): void {
    if (
      productStatus === ProductStatus.ACTIVE &&
      collectionStatus === CollectionStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        'Cannot place an ACTIVE product on an ARCHIVED collection',
      );
    }
  }

  private assertActivatable(
    variants: Array<
      Pick<ProductVariant, 'isAvailable' | 'stockQty' | 'reservedQty'>
    >,
    imageCount: number,
  ): void {
    if (!variants.some(isVariantSellable)) {
      throw new BadRequestException(
        'Add at least one available size with stock before activating this product',
      );
    }
    if (imageCount < 1) {
      throw new BadRequestException(
        'Add at least one product image before activating this product',
      );
    }
  }

  private assertMutable(product: { status: ProductStatus }): void {
    if (product.status === ProductStatus.DELETED) {
      throw new BadRequestException(
        'Deleted products cannot be edited. Restore is not supported.',
      );
    }
  }

  private async requireAdminById(
    id: string,
  ): Promise<ProductWithCatalogRelations> {
    const product = await this.productRepository.findAdminById(id);

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return product;
  }

  private mapProductSlugConflict(
    error: unknown,
    slug: string | undefined,
  ): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      slug !== undefined
    ) {
      return new ConflictException(
        `A product with slug "${slug}" already exists`,
      );
    }

    return error;
  }

  // --- Admin: variants ---

  async createVariant(
    productId: string,
    input: CreateVariantDto,
  ): Promise<AdminProductVariant> {
    const product = await this.requireAdminById(productId);
    this.assertMutable(product);

    try {
      const variant = await this.productRepository.createVariant(productId, {
        sizeMl: input.sizeMl,
        pricePaise: input.pricePaise,
        compareAtPricePaise: input.compareAtPricePaise ?? null,
        sku: input.sku ?? null,
        stockQty: input.stockQty ?? 0,
      });

      return toAdminVariant(variant);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A variant of ${input.sizeMl}ml already exists for this product`,
        );
      }

      throw error;
    }
  }

  async updateVariant(
    productId: string,
    variantId: string,
    input: UpdateVariantDto,
  ): Promise<AdminProductVariant> {
    const product = await this.requireAdminById(productId);
    this.assertMutable(product);
    await this.requireVariantOfProduct(productId, variantId);

    const variant = await this.productRepository.updateVariant(variantId, {
      ...(input.pricePaise !== undefined
        ? { pricePaise: input.pricePaise }
        : {}),
      ...(input.compareAtPricePaise !== undefined
        ? { compareAtPricePaise: input.compareAtPricePaise }
        : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.isAvailable !== undefined
        ? { isAvailable: input.isAvailable }
        : {}),
    });

    return toAdminVariant(variant);
  }

  private async requireVariantOfProduct(
    productId: string,
    variantId: string,
  ): Promise<ProductVariant> {
    const variant = await this.productRepository.findVariantById(variantId);

    if (!variant || variant.productId !== productId) {
      throw new NotFoundException(
        `Variant with id "${variantId}" not found for this product`,
      );
    }

    return variant;
  }

  // --- Admin: inventory ---

  async adjustStock(
    productId: string,
    variantId: string,
    input: AdjustStockDto,
  ): Promise<AdminProductVariant> {
    const product = await this.requireAdminById(productId);
    this.assertMutable(product);

    const hasAdjustment = input.adjustment !== undefined;
    const hasAbsolute = input.stockQty !== undefined;

    if (hasAdjustment === hasAbsolute) {
      throw new BadRequestException(
        'Provide exactly one of "adjustment" or "stockQty"',
      );
    }

    if (hasAdjustment && input.adjustment === 0) {
      throw new BadRequestException('adjustment must be a non-zero integer');
    }

    const variant = await this.requireVariantOfProduct(productId, variantId);
    const nextStockQty = hasAdjustment
      ? variant.stockQty + (input.adjustment as number)
      : (input.stockQty as number);

    if (nextStockQty < 0) {
      throw new BadRequestException('Stock cannot go negative');
    }

    if (nextStockQty < variant.reservedQty) {
      throw new BadRequestException(
        'Cannot reduce stock below the reserved quantity',
      );
    }

    const updated = await this.productRepository.updateVariant(variantId, {
      stockQty: nextStockQty,
    });

    return toAdminVariant(updated);
  }

  // --- Admin: images ---

  async addImage(
    productId: string,
    file: Express.Multer.File,
    input: CreateImageDto,
  ): Promise<AdminProductImage> {
    const product = await this.requireAdminById(productId);
    this.assertMutable(product);

    const uploaded = await this.mediaService.uploadProductImage(
      productId,
      file,
    );

    try {
      const image = await this.productRepository.createImage(productId, {
        url: uploaded.url,
        storagePath: uploaded.storagePath,
        altText: input.altText ?? null,
        displayOrder: input.displayOrder ?? 0,
      });

      return toAdminImage(image);
    } catch (error) {
      await this.mediaService.remove(uploaded.storagePath);
      throw error;
    }
  }

  async updateImage(
    productId: string,
    imageId: string,
    input: UpdateImageDto,
  ): Promise<AdminProductImage> {
    const product = await this.requireAdminById(productId);
    this.assertMutable(product);
    await this.requireImageOfProduct(productId, imageId);

    const image = await this.productRepository.updateImage(imageId, {
      ...(input.altText !== undefined ? { altText: input.altText } : {}),
      ...(input.displayOrder !== undefined
        ? { displayOrder: input.displayOrder }
        : {}),
    });

    return toAdminImage(image);
  }

  async removeImage(productId: string, imageId: string): Promise<void> {
    const product = await this.requireAdminById(productId);
    this.assertMutable(product);
    const image = await this.requireImageOfProduct(productId, imageId);
    await this.mediaService.remove(image.storagePath);
    await this.productRepository.deleteImage(imageId);
  }

  /**
   * Narrow park path for create-and-release into an archived collection.
   * Does not open DRAFT→ARCHIVED for general admin edits — only this endpoint.
   * Product stays off the shop until the collection is restored (COLLECTION cascade).
   */
  async parkReadyProductInArchivedCollection(
    id: string,
  ): Promise<AdminProductDetail> {
    const product = await this.requireAdminById(id);
    this.assertMutable(product);

    if (product.status !== ProductStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft products can be parked into an archived collection',
      );
    }

    if (product.collection.status !== CollectionStatus.ARCHIVED) {
      throw new BadRequestException(
        'Collection is not archived — activate the product instead',
      );
    }

    this.assertActivatable(product.variants, product.images.length);

    const updated = await this.productRepository.update(id, {
      status: ProductStatus.ARCHIVED,
      archiveReason: reasonForCollectionArchive(),
    });

    return toAdminProductDetail(updated);
  }

  /**
   * Shelf-off: keep product ACTIVE but mark every size unavailable.
   * Removes the product from shop listings once no sellable sizes remain.
   */
  async makeAllVariantsUnavailable(
    productId: string,
  ): Promise<AdminProductDetail> {
    const product = await this.requireAdminById(productId);
    this.assertMutable(product);

    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        'Only ACTIVE products can have all sizes made unavailable',
      );
    }

    await this.prisma.productVariant.updateMany({
      where: { productId, isAvailable: true },
      data: { isAvailable: false },
    });

    return this.getAdminById(productId);
  }

  /** Distinct carts that currently hold any of this product's variants. */
  async countCartsHoldingProduct(productId: string): Promise<number> {
    const rows = await this.prisma.cartItem.findMany({
      where: {
        productVariant: { productId },
      },
      select: { cartId: true },
      distinct: ['cartId'],
    });
    return rows.length;
  }

  private async requireImageOfProduct(productId: string, imageId: string) {
    const image = await this.productRepository.findImageById(imageId);

    if (!image || image.productId !== productId) {
      throw new NotFoundException(
        `Image with id "${imageId}" not found for this product`,
      );
    }

    return image;
  }
}
