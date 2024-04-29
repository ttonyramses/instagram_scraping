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
exports.Logger = void 0;
const inversify_1 = require("inversify");
const winston_1 = require("winston");
let Logger = class Logger {
    constructor() {
        this.customLevels = {
            levels: {
                trace: 5,
                debug: 4,
                info: 3,
                warn: 2,
                error: 1,
                fatal: 0,
            },
            colors: {
                trace: 'blue',
                debug: 'green',
                info: 'green',
                warn: 'yellow',
                error: 'red',
                fatal: 'red',
            },
        };
        this.logger = (0, winston_1.createLogger)({
            transports: [new winston_1.transports.Console()],
        });
    }
    info(msg, meta) {
        this.logger.info(msg, meta);
    }
    warn(msg, meta) {
        this.logger.warn(msg, meta);
    }
    error(msg, meta) {
        this.logger.error(msg, meta);
    }
    fatal(msg, meta) {
        this.logger.log('fatal', msg, meta);
    }
};
exports.Logger = Logger;
exports.Logger = Logger = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], Logger);
//# sourceMappingURL=logger.service.js.map