import { inject, injectable } from 'inversify';
import { DataSource, ObjectType, Repository } from 'typeorm';
import { TYPES } from '../../core/type.core';
import { IDatabaseService } from '../interface/idatabase.service';
import { Logger } from '../../logger/service/logger.service';
import appDataSource from '../datasource.config';

@injectable()
export class DatabaseService implements IDatabaseService {
  private myDataSource!: DataSource;
  constructor(@inject(TYPES.Logger) private readonly logger: Logger) {
    console.log("DatabaseService constructor #####################################################");
  }

  public async openConnection(): Promise<void> {
    console.log("openConnection #####################################################");
    
    if (this.myDataSource?.isInitialized) {
      this.logger.info('Connection Already Established!');
      console.log('Connection Already Established!');
    } else {
      try {
        this.myDataSource = await appDataSource.initialize();
        this.logger.info('Connection Established!');
        console.log('Connection Established!');
      } catch (error) {
        this.logger.error(`Connection Failed. Error: ${error}`);
        console.log(`Connection Failed. Error: ${error}`);
      }
    }
  }

  public async closeConnection(): Promise<void> {
    if (this.myDataSource?.isInitialized) {
      this.myDataSource.destroy();
      this.logger.info('Connection Closed!');
      console.log('Connection Closed');
    } else {
      this.logger.info('Connection Already Closed!');
      console.log('Connection Already Closed!');
    }
  }

  public getRepository(entity: ObjectType<any>): Repository<any> {
    return this.myDataSource.getRepository(entity);
  }
}
