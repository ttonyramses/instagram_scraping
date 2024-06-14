import { Follow } from "../type";

export interface IScrapingService {
  getAllInfos( force: boolean, cookiesFileName: string, selectorsFileName:string, pseudoList?: string[]): Promise<void>;
  getAllFollow(follow: Follow, force: boolean, cookiesFileName: string, selectorsFileName:string, maxId:string, nbFollow:number,hobbies?: string[], pseudoList?: string[]): Promise<void>;
  applyHobbies(hobbies:string[], pseudos: string[]): Promise<void>;
}
