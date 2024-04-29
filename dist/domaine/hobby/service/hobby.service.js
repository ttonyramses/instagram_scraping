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
exports.HobbyService = void 0;
const inversify_1 = require("inversify");
const type_core_1 = require("../../../core/type.core");
const hobby_entity_1 = require("../entity/hobby.entity");
let HobbyService = class HobbyService {
    constructor(database) {
        this.database = database;
        this.hobbyRepository = database.getRepository(hobby_entity_1.Hobby);
    }
    async save(hobbyDto) {
        return this.hobbyRepository.save(hobbyDto);
    }
    async saveAll(hobbyDtos) {
        return this.hobbyRepository.save(hobbyDtos);
    }
    async findOneHobby(id) {
        try {
            const hobby = await this.hobbyRepository.findOneOrFail({
                where: { id: id },
            });
            return hobby;
        }
        catch (error) {
            console.log(error);
        }
    }
    async findOneHobbyByName(name) {
        try {
            const hobby = await this.hobbyRepository.findOneOrFail({
                where: { name: name },
            });
            return hobby;
        }
        catch (error) {
            console.log(error);
        }
    }
    async findAll() {
        return this.hobbyRepository.find();
    }
};
exports.HobbyService = HobbyService;
exports.HobbyService = HobbyService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(type_core_1.TYPES.IDatabaseService)),
    __metadata("design:paramtypes", [Object])
], HobbyService);
//# sourceMappingURL=hobby.service.js.map