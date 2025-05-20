import { UserDto } from '../../domaine/user/dto/user.dto';

// ifollower.service.ts
export interface IFollowerService {
  getAllFollowers(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    maxId?: string,
    nbFollow?: number,
    hobbies?: string[],
    pseudoList?: string[],
  ): Promise<void>;
}
