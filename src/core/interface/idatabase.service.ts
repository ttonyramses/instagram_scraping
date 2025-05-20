import { FindOptionsWhere, ObjectLiteral, DeepPartial } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export interface IDatabaseService {
  find<T extends ObjectLiteral>(entity: new () => T, options?: FindOptionsWhere<T>): Promise<T[]>;
  findOne<T extends ObjectLiteral>(entity: new () => T, options: FindOptionsWhere<T>): Promise<T>;
  save<T extends ObjectLiteral>(entity: new () => T, data: DeepPartial<T>): Promise<T>;
  update<T extends ObjectLiteral>(entity: new () => T, id: string | number, data: QueryDeepPartialEntity<T>): Promise<void>;
  delete<T extends ObjectLiteral>(entity: new () => T, id: string | number): Promise<void>;
} 