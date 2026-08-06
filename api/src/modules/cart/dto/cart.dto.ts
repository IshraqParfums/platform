import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import {
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
  quantity!: number;
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

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items!: MergeCartItemDto[];
}

/** `?view=summary|full` on cart mutations. */
export class CartMutationViewQueryDto {
  @IsOptional()
  @IsIn([...CART_MUTATION_VIEWS])
  view?: CartMutationView;
}
