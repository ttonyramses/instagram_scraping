import { Hobby } from '../entities/hobby.entity';

export interface HobbyRepository {
  findById(id: number): Promise<Hobby | null>;
  findByName(name: string): Promise<Hobby | null>;
  findAll(): Promise<Hobby[]>;
  save(hobby: Hobby): Promise<Hobby>;
  delete(id: number): Promise<void>;
}
