export interface IScrapingService {
  getAllInfos( force: boolean, cookiesFileName:string, pseudoList?: string[]): Promise<void>;
  getAllFollow( force: boolean, cookiesFileName: string, hobbies?: string[], pseudoList?: string[]): Promise<void>;
  applyHobbies(hobbies:string[], pseudos: string[]): Promise<void>;
}
