import { Follow } from "../type";

// iscraping.service.ts
export interface IScrapingService {
  getCookiesInfos(loginJsonFileName: string, selectorsFileName: string): Promise<void>;
  getAllInfos(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    pseudoList?: string[],
  ): Promise<void>;
  getAllFollow(
    follow: Follow,
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    maxId?: string,
    nbFollow?: number,
    hobbies?: string[],
    pseudoList?: string[],
  ): Promise<void>;
  applyHobbies(hobbies: string[], pseudos: string[]): Promise<void>;
}
