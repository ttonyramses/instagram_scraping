import { HobbyDto } from '../dto/hobby.dto';
import { Hobby } from '../entity/hobby.entity';

export interface IHobbyService {
  save(hobbyDto: HobbyDto): Promise<Hobby>
  findAll(): Promise<HobbyDto[]>;
  findOne(id: number): Promise<HobbyDto>;
  findByName(name: string): Promise<HobbyDto>;
  create(hobbyDto: HobbyDto): Promise<HobbyDto>;
  update(id: number, hobbyDto: HobbyDto): Promise<HobbyDto>;
  delete(id: number): Promise<void>;
} 