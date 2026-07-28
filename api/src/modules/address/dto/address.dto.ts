import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(10)
  phone!: string;

  @IsString()
  @MinLength(1)
  line1!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  line2?: string | null;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(1)
  state!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  pincode!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  line1?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  line2?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  state?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  pincode?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;
}
