import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BESPOKE_MAX_LINE_QUANTITY,
  CART_MUTATION_VIEWS,
  type CartMutationView,
} from '@ishraqparfums/shared';

export class AddCartItemDto {
  @IsUUID()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class AddBespokeCartItemDto {
  @IsUUID()
  bespokePerfumeId!: string;

  @IsInt()
  @Min(1)
  sizeMl!: number;

  @IsInt()
  @Min(1)
  @Max(BESPOKE_MAX_LINE_QUANTITY)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(8)
  sessionTokens?: string[];
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class MergeCartItemDto {
  @IsUUID()
  variantId!: string;

  @IsInt()
  quantity!: number;
}

export class MergeBespokeCartItemDto {
  @IsUUID()
  bespokePerfumeId!: string;

  @IsInt()
  @Min(1)
  sizeMl!: number;

  @IsInt()
  quantity!: number;
}

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items!: MergeCartItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeBespokeCartItemDto)
  bespokeItems?: MergeBespokeCartItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(8)
  sessionTokens?: string[];
}

/** `?view=summary|full` on cart mutations. */
export class CartMutationViewQueryDto {
  @IsOptional()
  @IsIn([...CART_MUTATION_VIEWS])
  view?: CartMutationView;
}
