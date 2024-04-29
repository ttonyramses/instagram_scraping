export interface IScrapingService {
    getOneInfos(pseudo: string, force: boolean, cookiesFileName?: string): Promise<void>;
    getAllInfos(force: boolean, cookiesFileName?: string): Promise<void>;
    getOneFollow(pseudo: string, force: boolean, cookiesFileName?: string): Promise<void>;
    getAllFollow(hobby: string, force: boolean, cookiesFileName?: string): Promise<void>;
    applyHobbies(hobby: string, pseudos: string[]): Promise<void>;
}
