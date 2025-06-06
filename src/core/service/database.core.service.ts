import { inject, injectable } from 'inversify';
import { IdatabaseCoreService } from '../interface/idatabase.core.service';
import { TYPES } from '../type.core';
import { Logger } from 'winston';
import {
  DataSource,
  DeepPartial,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

@injectable()
export class DatabaseCoreService implements IdatabaseCoreService {
  private dataSource: DataSource;

  constructor(@inject(TYPES.Logger) private readonly logger: Logger) {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'instagram_scraping',
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
    });
  }

  async initialize(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
      this.logger.info('Database connection established');
    }
  }

  async find<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options?: FindOptionsWhere<T>,
  ): Promise<T[]> {
    await this.initialize();
    return this.dataSource.getRepository(entity).find({ where: options });
  }

  async findOne<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options: FindOptionsWhere<T>,
  ): Promise<T | null> {
    await this.initialize();
    return this.dataSource.getRepository(entity).findOne({ where: options });
  }

  async save<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    data: DeepPartial<T>,
  ): Promise<T> {
    await this.initialize();
    return this.dataSource.getRepository(entity).save(data as DeepPartial<T>);
  }

  async update<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    id: string | number,
    data: QueryDeepPartialEntity<T>,
  ): Promise<void> {
    await this.initialize();
    await this.dataSource.getRepository(entity).update(id, data);
  }

  async delete<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    id: string | number,
  ): Promise<void> {
    await this.initialize();
    await this.dataSource.getRepository(entity).delete(id);
  }
}