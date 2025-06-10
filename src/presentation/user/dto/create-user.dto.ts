import { IsOptional, IsString, IsNumber, IsUrl } from 'class-validator';

export class CreateUserDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsNumber()
  instagramId?: number;

  @IsOptional()
  @IsNumber()
  facebookId?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @IsOptional()
  @IsUrl()
  profileUrl?: string;
}
