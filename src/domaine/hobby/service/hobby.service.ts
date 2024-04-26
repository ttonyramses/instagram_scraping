import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';
import { IDatabaseService } from '../../../database/interface/idatabase.service';
import { TYPES } from '../../../core/type.core';
import { HobbyDto } from '../dto/hobby.dto';
import { IHobbyService } from '../interface/ihobby.service';
import { Hobby } from '../entity/hobby.entity';

@injectable()
export class HobbyService implements IHobbyService {
  private hobbyRepository: Repository<Hobby>;

  constructor( @inject(TYPES.IDatabaseService) private readonly database: IDatabaseService ) {
    this.hobbyRepository = database.getRepository(Hobby);
  }

  async save(hobbyDto: HobbyDto): Promise<Hobby> {
    return this.hobbyRepository.save(hobbyDto);
  }

  async saveAll(hobbyDtos: HobbyDto[]): Promise<Hobby[]> {
    return this.hobbyRepository.save(hobbyDtos);
  }

  async findOneHobby(id: number): Promise<Hobby> {
    try {
      const hobby = await this.hobbyRepository.findOneOrFail({
        where: { id: id },
      });
      return hobby;
    } catch (error) {
      console.log(error);
    }
  }

  async findOneHobbyByName(name: string): Promise<Hobby> {
    try {
      const hobby = await this.hobbyRepository.findOneOrFail({
        where: { name: name },
      });
      return hobby;
    } catch (error) {
      console.log(error);
    }
  }


  async findAll(): Promise<Hobby[]> {
    return this.hobbyRepository.find();
  }

}
