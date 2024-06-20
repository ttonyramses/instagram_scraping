import { HobbyDto } from "../../hobby/dto/hobby.dto";

export class UserDto {
  id: string;
  name?: string;
  biography?: string;
  nbFollowers?: number;
  nbFollowings?: number;
  nbPublications?: number;
  instagramId?: number;
  facebookId?: number;
  category?: string;
  externalUrl?: string;
  profileUrl?: string;
  hasInfo?: boolean;
  hasProcess?: boolean;
  enable?: boolean;
}
