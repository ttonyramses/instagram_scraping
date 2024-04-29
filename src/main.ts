import 'reflect-metadata';
import * as dotenv from 'dotenv';

import { UserService } from './domaine/user/service/user.service';
import { Database } from 'sqlite3';
import { DatabaseService } from './database/service/database.service';
import container from './core/container.core';
import { TYPES } from './core/type.core';
import { IDatabaseService } from './database/interface/idatabase.service';
import { IUserService } from './domaine/user/interface/iuser.service';
import { HobbyService } from './domaine/hobby/service/hobby.service';
import { ScrapingService } from './scraping/service/scraping.service';

dotenv.config();

async function bootstrap(): Promise<void> {
  const databaseService = container.get<IDatabaseService>(
    TYPES.IDatabaseService,
  );
  try {
    await databaseService.openConnection();
    const userService = container.get<IUserService>(TYPES.IUserService);
    const hobbyService = container.resolve(HobbyService);
    const scrapingService = container.resolve(ScrapingService);

    await userService.save({ id: 'ttonyramses' });
    await userService.save({ id: 'jacob_pio' });
    await userService.save({ id: 'followings_user_1' });
    await userService.addFollowers('ttonyramses', [{ id: 'jacob_pio' }]);
    await userService.addFollowers('ttonyramses', [
      { id: 'followings_user_1' },
    ]);

    let hobby = await hobbyService.findOneHobbyByName('chretien');
    if(!hobby){
      hobby = await hobbyService.save({ name: 'chretien' });
    }
    await userService.addHobbies('ttonyramses', [hobby]);

    const users = await userService.findAll();

    const user_tony = await userService.findOneUserWithRelations('ttonyramses');

    console.log('users = ', users);
    console.log('user_tony = ', user_tony);

    //await scrapingService.getOneInfos('ttonyramses', false, 'cookies.json');

    process.on('SIGINT', async () => {
      await databaseService.closeConnection();
    });
  } catch (err) {
    console.log('=================================================');
    console.log(err);
    await databaseService.closeConnection();
  } finally {
    await databaseService.closeConnection();
  }
}

bootstrap();
