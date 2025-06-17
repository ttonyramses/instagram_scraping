export class UserDto {
  id: string;
  name?: string;
  biography?: string;
  json?: object;
  nbFollowers?: number;
  nbFollowings?: number;
  nbPublications?: number;
  instagramId?: number;
  facebookId?: number;
  category?: string;
  externalUrl?: string;
  profileUrl?: string;
  hasInfo?: boolean;
  hasFollowerProcess?: boolean;
  hasFollowingProcess?: boolean;
  enable?: boolean;
  maxIdFollower?: string;
  maxIdFollowing?: string;
  createAt?: Date;
  updateAt?: Date;
}
