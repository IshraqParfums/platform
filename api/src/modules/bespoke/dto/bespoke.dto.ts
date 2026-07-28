import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SaveBespokeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsObject()
  formula!: Record<string, unknown>;

  @IsArray()
  answers!: unknown[];

  @IsString()
  @MinLength(1)
  moodText!: string;

  @IsArray()
  why!: string[];

  @IsOptional()
  @IsArray()
  inspired?: unknown[];

  @IsString()
  @MinLength(1)
  engineVersion!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  clientKey?: string;
}

export class MergeBespokeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveBespokeDto)
  items!: SaveBespokeDto[];
}

export class RenameBespokeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}

export class BespokePreviewDto {
  @IsArray()
  @ArrayMinSize(1)
  answers!: unknown[];

  @IsOptional()
  @IsArray()
  interimRanked?: string[];
}
