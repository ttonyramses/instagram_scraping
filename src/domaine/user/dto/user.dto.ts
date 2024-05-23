import { HobbyDto } from "../../hobby/dto/hobby.dto";

export class UserDto {
  id: string;
  name?: string;
  biography?: string;
  nbFollowers?: number;
  nbFollowing?: number;
  hasInfo?: boolean;
  hasProcess?: boolean;
  enable?: boolean;
}
