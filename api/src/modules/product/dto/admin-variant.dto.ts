import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateVariantDto {
  @IsInt()
  @Min(1)
  sizeMl!: number;

  @IsInt()
  @Min(1)
  pricePaise!: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  compareAtPricePaise?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MinLength(1)
  sku?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQty?: number;
}

export class UpdateVariantDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  pricePaise?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  compareAtPricePaise?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MinLength(1)
  sku?: string | null;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
