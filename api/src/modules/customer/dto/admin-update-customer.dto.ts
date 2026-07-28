import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminUpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
