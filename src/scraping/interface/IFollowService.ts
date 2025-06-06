import { UserDto } from '../../domaine/user/dto/user.dto';
import {Follow} from "../type";

// ifollow.service.ts
export interface IFollowService {
  getAllFollowers(
    follow: Follow,
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    maxId?: string,
    nbFollow?: number,
    hobbies?: string[],
    pseudoList?: string[],
  ): Promise<void>;
}
