import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListCollectionsQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  homepage?: boolean;
}
