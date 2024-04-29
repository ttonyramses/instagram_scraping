import { ObjectType, Repository } from 'typeorm';
export interface IDatabaseService {
    getRepository(entity: ObjectType<any>): Repository<any>;
    openConnection(): Promise<void>;
    closeConnection(): Promise<void>;
}
