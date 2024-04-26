import 'reflect-metadata';
import * as dotenv from 'dotenv';

import { UserService } from './modules/user/service/user.service';
import { Database } from 'sqlite3';
import { DatabaseService } from './database/service/database.service';
import container from './core/container.core';
import { TYPES } from './core/type.core';
import { IDatabaseService } from './database/interface/idatabase.service';
import { IUserService } from './modules/user/interface/iuser.service';

dotenv.config();

async function bootstrap(): Promise<void> {
  const databaseService = container.get<IDatabaseService>(
    TYPES.IDatabaseService,
  );
  try {
    await databaseService.openConnection();
    const userService = container.get<IUserService>(TYPES.IUserService);

    await userService.createOrUpdate({ id: 'ttonyramses' });
    await userService.createOrUpdate({ id: 'jacob_pio' });

    const users = await userService.findAll();

    console.log('users = ', users);

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
