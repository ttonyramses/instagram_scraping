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
Object.defineProperty(exports, "__esModule", { value: true });
exports.weighting = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/entity/user.entity");
const hobby_entity_1 = require("../../hobby/entity/hobby.entity");
let weighting = class weighting {
};
exports.weighting = weighting;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], weighting.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hobby_entity_1.Hobby),
    __metadata("design:type", hobby_entity_1.Hobby)
], weighting.prototype, "hobby", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], weighting.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], weighting.prototype, "score", void 0);
exports.weighting = weighting = __decorate([
    (0, typeorm_1.Entity)({ name: 'weighting' })
], weighting);
//# sourceMappingURL=weighting.entity.js.map