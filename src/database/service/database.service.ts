import { inject, injectable } from 'inversify';
import { DataSource, ObjectType, Repository } from 'typeorm';
import { TYPES } from '../../core/type.core';
import { IDatabaseService } from '../interface/idatabase.service';
import { Logger } from '../../logger/service/logger.service';
import appDataSource from '../datasource_postgres.config';
//import appDataSource from '../datasource_sqlite.config';

@injectable()
export class DatabaseService implements IDatabaseService {
  private myDataSource!: DataSource;
  constructor(@inject(TYPES.Logger) private readonly logger: Logger) {
  }

  public async openConnection(): Promise<void> {    
    if (this.myDataSource?.isInitialized) {
      this.logger.info('Database Connection Already Established!');
    } else {
      try {
        this.myDataSource = await appDataSource.initialize();
        this.logger.info('Database Connection Established!');
      } catch (error) {
        this.logger.error(`Database Connection Failed. Error: ${error}`);
      }
    }
  }

  public async closeConnection(): Promise<void> {
    if (this.myDataSource?.isInitialized) {
      this.myDataSource.destroy();
      this.logger.info('Database Connection Closed!');
    } else {
      this.logger.info('Database Connection Already Closed!');
    }
  }

  public getRepository(entity: ObjectType<any>): Repository<any> {
    return this.myDataSource.getRepository(entity);
  }
}
