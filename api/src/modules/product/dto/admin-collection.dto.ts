import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CreateCollectionDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase, kebab-case (e.g. "limited-edition")',
  })
  slug!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  description?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  editorialLabel?: string | null;
}

export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase, kebab-case (e.g. "limited-edition")',
  })
  slug?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  description?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  editorialLabel?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  homeRank?: number | null;
}
