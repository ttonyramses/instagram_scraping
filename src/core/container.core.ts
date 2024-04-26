import { Container } from 'inversify';
import { TYPES } from './type.core';
import { DatabaseService } from '../database/service/database.service';
import { Logger } from '../logger/service/logger.service';

import { IUserService } from '../domaine/user/interface/iuser.service';
import { UserService } from '../domaine/user/service/user.service';
import { IDatabaseService } from '../database/interface/idatabase.service';
import { IHobbyService } from '../domaine/hobby/interface/ihobby.service';
import { HobbyService } from '../domaine/hobby/service/hobby.service';
import { IScrapingService } from '../scraping/interface/iscraping.service';
import { ScrapingService } from '../scraping/service/scraping.service';

const container = new Container();

container.bind<IDatabaseService>(TYPES.IDatabaseService).to(DatabaseService).inSingletonScope();
container.bind(TYPES.Logger).to(Logger).inSingletonScope();
container.bind<IUserService>(TYPES.IUserService).to(UserService).inSingletonScope();
container.bind<IHobbyService>(TYPES.IHobbyService).to(HobbyService).inSingletonScope();
container.bind<IScrapingService>(TYPES.IScrapingService).to(ScrapingService);

export default container;