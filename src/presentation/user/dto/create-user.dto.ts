import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

@Expose()
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  biography: string;

  @IsString()
  @IsOptional()
  instagramId: number;

  @IsString()
  @IsOptional()
  facebookId: number;

  @IsString()
  @IsOptional()
  category: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  externalUrl: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  profileUrl: string;

  @IsBoolean()
  @IsOptional()
  hasInfo: boolean;

  @IsBoolean()
  @IsOptional()
  hasFollowerProcess: boolean;

  @IsBoolean()
  @IsOptional()
  hasFollowingProcess: boolean;

  @IsBoolean()
  @IsOptional()
  enable: boolean;

  @IsString()
  @IsOptional()
  maxIdFollower: string;

  @IsString()
  @IsOptional()
  maxIdFollowing: string;

  @IsObject()
  @IsOptional()
  json: object;

  @IsNumber()
  @IsOptional()
  nbFollowers: number;

  @IsNumber()
  @IsOptional()
  nbFollowings: number;

  @IsNumber()
  @IsOptional()
  nbPublications: number;
}
