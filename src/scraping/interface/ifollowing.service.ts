import { UserDto } from '../../domaine/user/dto/user.dto';

// ifollowing.service.ts
export interface IFollowingService {
  getAllFollowings(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    maxId?: string,
    nbFollow?: number,
    hobbies?: string[],
    pseudoList?: string[],
  ): Promise<void>;
  getFollowingsOfUser(
    userDto: UserDto,
    maxId: string,
    nbFollow: number,
  ): Promise<void>;
}
