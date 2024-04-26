import { Container } from 'inversify';
import { TYPES } from './type.core';
import { DatabaseService } from '../database/service/database.service';
import { Logger } from '../logger/service/logger.service';

import { IUserService } from '../modules/user/interface/iuser.service';
import { UserService } from '../modules/user/service/user.service';
import { IDatabaseService } from '../database/interface/idatabase.service';

const container = new Container();

container.bind<IDatabaseService>(TYPES.IDatabaseService).to(DatabaseService).inSingletonScope();
container.bind(TYPES.Logger).to(Logger).inSingletonScope();
container.bind<IUserService>(TYPES.IUserService).to(UserService).inSingletonScope();

export default container;