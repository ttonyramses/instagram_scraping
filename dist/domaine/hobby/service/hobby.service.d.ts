import { IDatabaseService } from '../../../database/interface/idatabase.service';
import { HobbyDto } from '../dto/hobby.dto';
import { IHobbyService } from '../interface/ihobby.service';
import { Hobby } from '../entity/hobby.entity';
export declare class HobbyService implements IHobbyService {
    private readonly database;
    private hobbyRepository;
    constructor(database: IDatabaseService);
    save(hobbyDto: HobbyDto): Promise<Hobby>;
    saveAll(hobbyDtos: HobbyDto[]): Promise<Hobby[]>;
    findOneHobby(id: number): Promise<Hobby>;
    findOneHobbyByName(name: string): Promise<Hobby>;
    findAll(): Promise<Hobby[]>;
}
