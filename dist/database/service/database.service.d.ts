import { ObjectType, Repository } from 'typeorm';
import { IDatabaseService } from '../interface/idatabase.service';
import { Logger } from '../../logger/service/logger.service';
export declare class DatabaseService implements IDatabaseService {
    private readonly logger;
    private myDataSource;
    constructor(logger: Logger);
    openConnection(): Promise<void>;
    closeConnection(): Promise<void>;
    getRepository(entity: ObjectType<any>): Repository<any>;
}
