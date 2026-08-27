import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ProductGender,
  ProductStatus,
  ScentIntensity,
  ScentLongevity,
  ScentSillage,
} from '@prisma/client';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MESSAGE =
  'slug must be lowercase, kebab-case (e.g. "citrus-atelier")';

/**
 * PDP content fields, shared by both create/update DTOs. `@IsOptional()`
 * throughout and deliberately without `@MinLength` — same reasoning as
 * `nameUrdu` above: the admin form posts "" (or []) to clear a field, and
 * the service maps that down to null/empty. The two JSON-shaped fields
 * (`meaningStory`, `notesPyramid`) and the FAQ array only get a shallow
 * `@IsObject()`/`@IsArray()` check here — ValidationPipe can't type-check
 * nested JSON, so `product.service.ts` whitelist-parses the real shape
 * before it ever reaches Prisma (see `asMeaningStory`/`asNotesPyramid`/
 * `asFaqList`), the same pattern `bespoke-session.service.ts` uses for
 * `asFingerprint`.
 */
class ProductPdpFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  pronunciation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meaning?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  taglinePrimary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  taglineTranslation?: string;

  @IsOptional()
  @IsObject()
  meaningStory?: unknown;

  @IsOptional()
  @IsObject()
  notesPyramid?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  scentFamily?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characterTags?: string[];

  @IsOptional()
  @IsEnum(ScentIntensity)
  intensity?: ScentIntensity;

  @IsOptional()
  @IsEnum(ScentSillage)
  sillage?: ScentSillage;

  @IsOptional()
  @IsEnum(ScentLongevity)
  longevity?: ScentLongevity;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  season?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  occasion?: string[];

  @IsOptional()
  @IsEnum(ProductGender)
  gender?: ProductGender;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  formatLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  concentration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  application?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bottleDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  howToUse?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  care?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  claims?: string[];

  @IsOptional()
  @IsArray()
  faq?: unknown[];
}

export class CreateProductDto extends ProductPdpFieldsDto {
  @IsUUID()
  collectionId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  // Optional on both DTOs, and deliberately without @MinLength: the admin form
  // posts "" to clear the field, and the service maps "" -> null. ValidationPipe
  // runs forbidNonWhitelisted, so omitting this would 400 every form submit.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameUrdu?: string;

  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug!: string;

  @IsString()
  @MinLength(1)
  shortDescription!: string;

  @IsString()
  @MinLength(1)
  detailedDescription!: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

export class UpdateProductDto extends ProductPdpFieldsDto {
  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameUrdu?: string;

  @IsOptional()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  detailedDescription?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
