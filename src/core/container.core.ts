import { Container } from 'inversify';
import { TYPES } from './type.core';
import { Logger, createLogger, format, transports } from 'winston';
import { IUserService } from '../domaine/user/interface/iuser.service';
import { UserService } from '../domaine/user/service/user.service';
import { IDatabaseService } from './interface/idatabase.service';
import { DatabaseService } from './service/database.service';
import { IHobbyService } from '../domaine/hobby/interface/ihobby.service';
import { HobbyService } from '../domaine/hobby/service/hobby.service';

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

export { container };