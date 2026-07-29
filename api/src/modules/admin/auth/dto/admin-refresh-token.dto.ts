import { IsString, MinLength } from 'class-validator';

export class AdminRefreshTokenDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
