import {Container} from 'inversify';
import {TYPES} from './type.core';
import {createLogger, format, Logger, transports} from 'winston';
import {IUserService} from "../domaine/user/interface/iuser.service";
import {UserService} from "../domaine/user/service/user.service";
import {IHobbyService} from "../domaine/hobby/interface/ihobby.service";
import {IHobbyScrapingService} from "../scraping/interface/ihobby-scraping.service";
import {HobbyService} from "../domaine/hobby/service/hobby.service";
import {HobbyScrapingService} from "../scraping/service/hobby-scraping.service";
import {DatabaseService} from "../database/service/database.service";
import {IDatabaseService} from "../database/interface/idatabase.service";
import {IBrowserService} from "../scraping/interface/ibrowser.service";
import {BrowserService} from "../scraping/service/browser.service";
import {IAuthService} from "../scraping/interface/iauth.service";
import {AuthService} from "../scraping/service/auth.service";
import {IFollowService} from "../scraping/interface/IFollowService";
import {FollowService} from "../scraping/service/follow.service";
import {IScrapingService} from "../scraping/interface/iscraping.service";
import {ScrapingService} from "../scraping/service/scraping.service";
import {IUserInfoService} from "../scraping/interface/iuser-info.service";
import {UserInfoService} from "../scraping/service/user-info.service";



const container = new Container();

// Créer une instance de Logger au lieu d'utiliser la classe elle-même
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ]
});

// Injecter l'instance de logger, pas la classe
container.bind<Logger>(TYPES.Logger).toConstantValue(logger);
container.bind<IDatabaseService>(TYPES.IDatabaseService).to(DatabaseService).inSingletonScope();

// Assurez-vous que UserService implémente bien IUserService
// Si UserService n'implémente pas complètement IUserService, vous devez soit:
// 1. Compléter UserService pour implémenter toutes les méthodes requises
// 2. Ou utiliser une fabrique personnalisée
container.bind<IUserService>(TYPES.IUserService).to(UserService).inSingletonScope();
container.bind<IHobbyService>(TYPES.IHobbyService).to(HobbyService).inSingletonScope();
container.bind<IBrowserService>(TYPES.IBrowserService).to(BrowserService).inSingletonScope();
container.bind<IAuthService>(TYPES.IAuthService).to(AuthService).inSingletonScope();
container.bind<IFollowService>(TYPES.IFollowService).to(FollowService).inSingletonScope();
container.bind<IHobbyScrapingService>(TYPES.IHobbyScrapingService).to(HobbyScrapingService).inSingletonScope();
container.bind<IScrapingService>(TYPES.IScrapingService).to(ScrapingService).inSingletonScope();
container.bind<IUserInfoService>(TYPES.IUserInfoService).to(UserInfoService).inSingletonScope();


export { container };
