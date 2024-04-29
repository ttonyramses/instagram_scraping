"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = require("dotenv");
const commander_1 = require("commander");
const scraping_service_1 = require("./scraping/service/scraping.service");
const type_core_1 = require("./core/type.core");
const container_core_1 = require("./core/container.core");
dotenv.config();
commander_1.program
    .command('scrap-info')
    .description('scrap user information and save to database')
    .option('-u, --users [value...]', 'user or list of user to process')
    .option('-c, --cookie <type>', 'file of cookies in .json', 'cookie.json')
    .option('-f, --force', 'force processing')
    .action(async (options) => {
    console.log('scrap-info');
    console.log(options);
    await bootstrap((scrapingService) => {
        console.log(scrapingService);
        scrapingService.getAllInfos(options.force ?? false, options.cookie);
    });
});
commander_1.program
    .command('scrap-follow')
    .description('scrap follower and following and save to database')
    .option('-u, --users [value...]', 'user or list of user to process')
    .option('-c, --cookie <type>', 'file of cookies in .json', 'cookie.json')
    .option('-f, --force', 'force processing')
    .action(async (options) => {
    console.log('scrap-follow');
    console.log(options);
    await bootstrap((scrapingService) => {
        console.log(scrapingService);
        scrapingService.getAllFollow(options.force ?? false, options.cookie, options.users);
    });
});
commander_1.program
    .command('add-hobby')
    .description('add hobby and bind to users')
    .requiredOption('-u, --users [value...]', 'user or list of user to bind with hoobies')
    .requiredOption('-h, --hobbies [value...]', 'hobby or list of hobbies to bind with users')
    .action(async (options) => {
    console.log('add-hobby');
    console.log(options);
    await bootstrap((scrapingService) => {
        console.log(scrapingService);
        scrapingService.applyHobbies(options.hobbies, options.users);
    });
});
commander_1.program
    .addOption(new commander_1.Option('--db_dir <type>', 'database directory').env('DATABASE_DIR'))
    .addOption(new commander_1.Option('--db_name <type>', 'database name').env('DATABASE_NAME'))
    .addOption(new commander_1.Option('--cookie_dir <type>', 'cookies json files directory').env('COOKIES_JSON_DIR'))
    .addOption(new commander_1.Option('--base_url <type>', 'base url of scraping site').env('BASE_SCRAPING_URL'))
    .addOption(new commander_1.Option('--env <type>', 'dev or prod').env('NODE_ENV'))
    .version('0.0.1', '-v, --vers', 'output the current version');
commander_1.program.parse(process.argv);
async function bootstrap(callback) {
    const databaseService = container_core_1.default.get(type_core_1.TYPES.IDatabaseService);
    try {
        await databaseService.openConnection();
        const scrapingService = container_core_1.default.resolve(scraping_service_1.ScrapingService);
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
//# sourceMappingURL=main.js.map