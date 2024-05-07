import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { program, Option } from 'commander';
import { IDatabaseService } from './database/interface/idatabase.service';
import { ScrapingService } from './scraping/service/scraping.service';
import { IScrapingService } from './scraping/interface/iscraping.service';
import { TYPES } from './core/type.core';
import container from './core/container.core';
import { Logger } from './logger/service/logger.service';

program
  .command('scrap-info')
  .description('scrap user information and save to database')
  .option('-u, --users [value...]', 'user or list of user to process')
  .option('-c, --cookies <type>', 'file of cookies in .json', 'cookies.json')
  .option('-s, --selectors <type>', 'file of selector in .json', 'selectors.json')
  .option('-f, --force', 'force processing')
  .action(async (options) => {
    await bootstrap(async (scrapingService) => {
      await scrapingService.getAllInfos(
        options.force ?? false,
        options.cookies,
        options.selectors,
        options.users,
      );
    });
  });

program
  .command('scrap-follow')
  .description('scrap follower and following and save to database')
  .option('-u, --users [value...]', 'user or list of user to process')
  .option(
    '-hb, --hobbies [value...]',
    'hobby or list of hobbies to bind with users',
  )
  .option('-c, --cookies <type>', 'file of cookies in .json', 'cookies.json')
  .option('-s, --selectors <type>', 'file of selector in .json', 'selectors.json')
  .option('-f, --force', 'force processing')
  .action(async (options) => {
    await bootstrap(async (scrapingService) => {
      await scrapingService.getAllFollow(
        options.force ?? false,
        options.cookies,
        options.selectors,
        options.hobbies,
        options.users,
      );
    });
  });

program
  .command('add-hobby')
  .description('add hobby and bind to users')
  .requiredOption(
    '-u, --users [value...]',
    'user or list of user to bind with hoobies',
  )
  .requiredOption(
    '-hb, --hobbies [value...]',
    'hobby or list of hobbies to bind with users',
  )
  .action(async (options) => {
    await bootstrap(async (scrapingService) => {
      await scrapingService.applyHobbies(options.hobbies, options.users);
    });
  });

program
  // .addOption(new Option('--db_dir <type>', 'database directory').env('DATABASE_DIR'))
  // .addOption(new Option('--db_name <type>', 'database name').env('DATABASE_NAME'))
  // .addOption(new Option('--cookie_dir <type>', 'cookies json files directory').env('COOKIES_JSON_DIR'))
  // .addOption(new Option('--base_url <type>', 'base url of scraping site').env('BASE_SCRAPING_URL'))
  // .addOption(new Option('--env <type>', 'dev or prod').env('NODE_ENV'))
  .version('0.0.1', '-v, --vers', 'output the current version');
program.parse(process.argv);
dotenv.config();

async function bootstrap(
  callback: (scrapingService: IScrapingService) => Promise<void>,
): Promise<void> {
  const databaseService = container.get<IDatabaseService>(
    TYPES.IDatabaseService,
  );
  const logger = container.get<Logger>(TYPES.Logger);

  try {
    await databaseService.openConnection();
    const scrapingService = container.resolve(ScrapingService);
    await callback(scrapingService);
    process.on('SIGINT', async () => {
      await databaseService.closeConnection();
    });
  } catch (err) {
    logger.error('main error ', err);
    await databaseService.closeConnection();
  } finally {
    await databaseService.closeConnection();
  }
}
