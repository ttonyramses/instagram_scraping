import { HobbyDto } from '../dto/hobby.dto';

export interface IHobbyService {
  findAll(): Promise<HobbyDto[]>;
  findOne(id: number): Promise<HobbyDto>;
  create(hobbyDto: HobbyDto): Promise<HobbyDto>;
  update(id: number, hobbyDto: HobbyDto): Promise<HobbyDto>;
  delete(id: number): Promise<void>;
} 