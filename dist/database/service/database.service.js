"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const inversify_1 = require("inversify");
const type_core_1 = require("../../core/type.core");
const logger_service_1 = require("../../logger/service/logger.service");
const datasource_config_1 = require("../datasource.config");
let DatabaseService = class DatabaseService {
    constructor(logger) {
        this.logger = logger;
        console.log("DatabaseService constructor #####################################################");
    }
    async openConnection() {
        console.log("openConnection #####################################################");
        if (this.myDataSource?.isInitialized) {
            this.logger.info('Connection Already Established!');
            console.log('Connection Already Established!');
        }
        else {
            try {
                this.myDataSource = await datasource_config_1.default.initialize();
                this.logger.info('Connection Established!');
                console.log('Connection Established!');
            }
            catch (error) {
                this.logger.error(`Connection Failed. Error: ${error}`);
                console.log(`Connection Failed. Error: ${error}`);
            }
        }
    }
    async closeConnection() {
        if (this.myDataSource?.isInitialized) {
            this.myDataSource.destroy();
            this.logger.info('Connection Closed!');
            console.log('Connection Closed');
        }
        else {
            this.logger.info('Connection Already Closed!');
            console.log('Connection Already Closed!');
        }
    }
    getRepository(entity) {
        return this.myDataSource.getRepository(entity);
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(type_core_1.TYPES.Logger)),
    __metadata("design:paramtypes", [logger_service_1.Logger])
], DatabaseService);
//# sourceMappingURL=database.service.js.map