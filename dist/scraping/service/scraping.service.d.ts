import { IScrapingService } from '../interface/iscraping.service';
import { IUserService } from '../../domaine/user/interface/iuser.service';
export declare class ScrapingService implements IScrapingService {
    private readonly userService;
    private page;
    private browser;
    private isBrowserInitialized;
    private baseUrl;
    constructor(userService: IUserService);
    applyHobbies(hobby: string, pseudos: string[]): Promise<void>;
    getOneInfos(pseudo: string, force: boolean, cookiesFileName?: string): Promise<void>;
    getAllInfos(force: boolean, cookiesFileName?: string): Promise<void>;
    getOneFollow(pseudo: string, force: boolean, cookiesFileName?: string): Promise<void>;
    getAllFollow(hobby: string, force: boolean, cookiesFileName?: string): Promise<void>;
    private initBrowser;
    private closeBrowser;
    private getInfoUserOnPage;
    private sleep;
}
