import { ArrayMaxSize, IsArray, IsString, MinLength } from 'class-validator';

export class AddWishlistItemDto {
  @IsString()
  @MinLength(1)
  slug!: string;
}

export class MergeWishlistDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(200)
  slugs!: string[];
}
