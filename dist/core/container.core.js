"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const type_core_1 = require("./type.core");
const database_service_1 = require("../database/service/database.service");
const logger_service_1 = require("../logger/service/logger.service");
const user_service_1 = require("../domaine/user/service/user.service");
const hobby_service_1 = require("../domaine/hobby/service/hobby.service");
const scraping_service_1 = require("../scraping/service/scraping.service");
const container = new inversify_1.Container();
container.bind(type_core_1.TYPES.IDatabaseService).to(database_service_1.DatabaseService).inSingletonScope();
container.bind(type_core_1.TYPES.Logger).to(logger_service_1.Logger).inSingletonScope();
container.bind(type_core_1.TYPES.IUserService).to(user_service_1.UserService).inSingletonScope();
container.bind(type_core_1.TYPES.IHobbyService).to(hobby_service_1.HobbyService).inSingletonScope();
container.bind(type_core_1.TYPES.IScrapingService).to(scraping_service_1.ScrapingService);
exports.default = container;
//# sourceMappingURL=container.core.js.map