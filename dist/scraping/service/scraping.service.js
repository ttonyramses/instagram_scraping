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
exports.ScrapingService = void 0;
const inversify_1 = require("inversify");
const type_core_1 = require("../../core/type.core");
const playwright_1 = require("playwright");
const user_dto_1 = require("../../domaine/user/dto/user.dto");
let ScrapingService = class ScrapingService {
    constructor(userService) {
        this.userService = userService;
        this.isBrowserInitialized = false;
        this.baseUrl = process.env.BASE_SCRAPING_URL;
    }
    async applyHobbies(hobby, pseudos) {
        throw new Error('Method not implemented.');
    }
    async getOneInfos(pseudo, force, cookiesFileName) {
        const user = await this.userService.findOneUser(pseudo);
        console.log('user =', user);
        console.log('force =', force);
        if (!user) {
            console.log('user ' + pseudo + 'not found ');
            return;
        }
        if (user.hasInfo && !force) {
            console.log('Les information de ' +
                pseudo +
                ' sont déjà présentes dans la base de données');
            return;
        }
        else {
            await this.initBrowser('/' + pseudo, cookiesFileName);
            const userDto = await this.getInfoUserOnPage(this.page);
            await this.userService.save(userDto);
            await this.closeBrowser();
        }
    }
    async getAllInfos(force, cookiesFileName) {
        throw new Error('Method not implemented.');
    }
    async getOneFollow(pseudo, force, cookiesFileName) {
        throw new Error('Method not implemented.');
    }
    async getAllFollow(hobby, force, cookiesFileName) {
        throw new Error('Method not implemented.');
    }
    async initBrowser(suiteUrl, cookiesFileName) {
        this.browser = await playwright_1.chromium.launch({ headless: false });
        const context = await this.browser.newContext();
        const cookies = (await Promise.resolve(`${process.env.COOKIES_JSON_DIR + '/' + cookiesFileName}`).then(s => require(s))).default;
        await context.grantPermissions(['notifications'], {
            origin: this.baseUrl,
        });
        this.page = await context.newPage();
        await context.addCookies(cookies);
        const newUrl = this.baseUrl + (suiteUrl ? suiteUrl : '');
        console.log('newUrl = ', newUrl);
        await this.page.goto(newUrl);
    }
    async closeBrowser() {
        await this.browser.close();
    }
    async getInfoUserOnPage(page) {
        const user = new user_dto_1.UserDto();
        await this.sleep(1_000);
        user.id = await page
            .locator('main.xvbhtw8 header.x1qjc9v5 section div.x9f619')
            .first()
            .textContent();
        user.nbFollowers = parseInt(await page
            .locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(2) span._ac2a')
            .first()
            .textContent());
        user.nbFollowing = parseInt(await page
            .locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(3) span._ac2a')
            .first()
            .textContent());
        user.name = await page
            .locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z span.x1lliihq')
            .first()
            .textContent();
        user.biography = await page
            .locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z h1')
            .first()
            .textContent();
        user.hasInfo = true;
        return user;
    }
    async sleep(time) {
        await setTimeout(() => { }, time);
    }
};
exports.ScrapingService = ScrapingService;
exports.ScrapingService = ScrapingService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(type_core_1.TYPES.IUserService)),
    __metadata("design:paramtypes", [Object])
], ScrapingService);
//# sourceMappingURL=scraping.service.js.map