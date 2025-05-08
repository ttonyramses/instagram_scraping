import { UserDto } from '../../domaine/user/dto/user.dto';

// iuser-info.service.ts
export interface IUserInfoService {
  getAllInfos(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    pseudoList?: string[],
  ): Promise<void>;
  getAndSaveInfoUser(user: UserDto): Promise<void>;
  getInfoUserApiByPseudo(pseudo: string): Promise<UserDto>;
  getInfoUserByApi(instagramId: number, pseudo: string): Promise<UserDto>;
  getInfoUserOnPage(pseudo: string): Promise<UserDto>;
}
