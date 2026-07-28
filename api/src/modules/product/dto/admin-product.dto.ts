import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { ProductStatus } from '@prisma/client';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MESSAGE =
  'slug must be lowercase, kebab-case (e.g. "citrus-atelier")';

export class CreateProductDto {
  @IsUUID()
  collectionId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

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

export class UpdateProductDto {
  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

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
