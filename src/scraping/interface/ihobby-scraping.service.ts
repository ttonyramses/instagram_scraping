import { UserDto } from '../../domaine/user/dto/user.dto';

export interface IHobbyScrapingService {
  applyHobbies(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    hobbies: string[],
    pseudoList?: string[],
  ): Promise<void>;

  getAndSaveHobbies(user: UserDto, hobbies: string[]): Promise<void>;

  getHobbiesByApi(
    instagramId: number,
    pseudo: string,
  ): Promise<string[]>;

  getHobbiesOnPage(pseudo: string): Promise<string[]>;
} 