"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = require("dotenv");
const container_core_1 = require("./core/container.core");
const type_core_1 = require("./core/type.core");
const hobby_service_1 = require("./domaine/hobby/service/hobby.service");
const scraping_service_1 = require("./scraping/service/scraping.service");
dotenv.config();
async function bootstrap() {
    const databaseService = container_core_1.default.get(type_core_1.TYPES.IDatabaseService);
    try {
        await databaseService.openConnection();
        const userService = container_core_1.default.get(type_core_1.TYPES.IUserService);
        const hobbyService = container_core_1.default.resolve(hobby_service_1.HobbyService);
        const scrapingService = container_core_1.default.resolve(scraping_service_1.ScrapingService);
        await userService.save({ id: 'ttonyramses' });
        await userService.save({ id: 'jacob_pio' });
        await userService.save({ id: 'followings_user_1' });
        await userService.addFollowers('ttonyramses', [{ id: 'jacob_pio' }]);
        await userService.addFollowers('ttonyramses', [
            { id: 'followings_user_1' },
        ]);
        let hobby = await hobbyService.findOneHobbyByName('chretien');
        if (!hobby) {
            hobby = await hobbyService.save({ name: 'chretien' });
        }
        await userService.addHobbies('ttonyramses', [hobby]);
        const users = await userService.findAll();
        const user_tony = await userService.findOneUserWithRelations('ttonyramses');
        console.log('users = ', users);
        console.log('user_tony = ', user_tony);
        process.on('SIGINT', async () => {
            await databaseService.closeConnection();
        });
    }
    catch (err) {
        console.log('=================================================');
        console.log(err);
        await databaseService.closeConnection();
    }
    finally {
        await databaseService.closeConnection();
    }
}
bootstrap();
//# sourceMappingURL=main_old.js.map