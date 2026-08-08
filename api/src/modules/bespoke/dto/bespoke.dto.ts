import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.query.dto';

export class AnswerBespokeSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nodeId!: string;

  /** The session version the client rendered this question at. */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  version!: number;

  /**
   * Shape depends on the node type, so it is validated against the node the
   * session is actually on rather than by decorators here.
   */
  @IsObject()
  answer!: Record<string, unknown>;
}

export class RenameBespokeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}

export class AdminBespokeListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(36)
  customerId?: string;
}

export class AdminBespokeAnalyticsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

export class AdminAtelierAccordSearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;
}
