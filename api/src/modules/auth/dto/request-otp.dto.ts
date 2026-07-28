import { IsString, MinLength } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @MinLength(10)
  phone!: string;
}
