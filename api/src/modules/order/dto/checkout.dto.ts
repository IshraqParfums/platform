import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class CheckoutDto {
  @IsUUID()
  addressId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;
}
