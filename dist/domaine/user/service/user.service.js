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
exports.UserService = void 0;
const inversify_1 = require("inversify");
const user_entity_1 = require("../entity/user.entity");
const type_core_1 = require("../../../core/type.core");
let UserService = class UserService {
    constructor(database) {
        this.database = database;
        this.userRepository = database.getRepository(user_entity_1.User);
    }
    async save(userDto) {
        return this.userRepository.save(userDto);
    }
    async saveAll(userDtos) {
        return this.userRepository.save(userDtos);
    }
    async findOneUser(id) {
        try {
            const user = await this.userRepository.findOneOrFail({
                where: { id: id },
            });
            return user;
        }
        catch (error) {
            console.log(error);
        }
    }
    async findOneUserWithRelations(id) {
        try {
            const user = await this.userRepository.findOneOrFail({
                where: { id: id },
                relations: ['followers', 'followings', 'hobbies'],
            });
            return user;
        }
        catch (error) {
            console.log(error);
        }
    }
    async findAll() {
        return this.userRepository.find();
    }
    async addFollowers(id, followers) {
        await this.userRepository
            .createQueryBuilder()
            .relation(user_entity_1.User, 'followers')
            .of(id)
            .remove((followers ?? []));
        await this.userRepository
            .createQueryBuilder()
            .relation(user_entity_1.User, 'followers')
            .of(id)
            .add(followers ?? []);
    }
    async addFollowings(id, followings) {
        await this.userRepository
            .createQueryBuilder()
            .relation(user_entity_1.User, 'followings')
            .of(id)
            .remove(followings ?? []);
        await this.userRepository
            .createQueryBuilder()
            .relation(user_entity_1.User, 'followings')
            .of(id)
            .add(followings ?? []);
    }
    async addHobbies(id, hobbies) {
        await this.userRepository
            .createQueryBuilder()
            .relation(user_entity_1.User, 'hobbies')
            .of(id)
            .remove(hobbies ?? []);
        await this.userRepository
            .createQueryBuilder()
            .relation(user_entity_1.User, 'hobbies')
            .of(id)
            .add(hobbies ?? []);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(type_core_1.TYPES.IDatabaseService)),
    __metadata("design:paramtypes", [Object])
], UserService);
//# sourceMappingURL=user.service.js.map