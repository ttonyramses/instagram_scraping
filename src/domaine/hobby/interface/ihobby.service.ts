import { HobbyDto } from '../dto/hobby.dto';
import { Hobby } from '../entity/hobby.entity';

export interface IHobbyService {
  save(hobbyDto: HobbyDto): Promise<Hobby>;
  saveAll(hobbyDtos: HobbyDto[]): Promise<Hobby[]>;
  findOneHobby(id: number): Promise<Hobby>;
  findOneHobbyByName(name: string): Promise<Hobby>;
  findAll(): Promise<Hobby[]>;
}
