import { IsString, Length, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @MinLength(10)
  phone!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
