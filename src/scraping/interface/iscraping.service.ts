export interface IScrapingService {
  getAllInfos( force: boolean, cookiesFileName:string, selectorsFileName:string, pseudoList?: string[]): Promise<void>;
  getAllFollow( force: boolean, cookiesFileName: string, selectorsFileName:string, hobbies?: string[], pseudoList?: string[]): Promise<void>;
  applyHobbies(hobbies:string[], pseudos: string[]): Promise<void>;
}
