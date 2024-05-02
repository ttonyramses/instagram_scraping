import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';
import { IDatabaseService } from '../../../database/interface/idatabase.service';
import { TYPES } from '../../../core/type.core';
import { HobbyDto } from '../dto/hobby.dto';
import { IHobbyService } from '../interface/ihobby.service';
import { Hobby } from '../entity/hobby.entity';
import { Logger } from 'winston';

@injectable()
export class HobbyService implements IHobbyService {
  private hobbyRepository: Repository<Hobby>;

  constructor(
    @inject(TYPES.IDatabaseService) private readonly database: IDatabaseService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {
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
      const hobby = await this.hobbyRepository.findOne({
        where: { id: id },
      });
      return hobby;
    } catch (error) {
      this.logger.error('saveAll error ', error);
    }
  }

  async findOneHobbyByName(name: string): Promise<Hobby> {
    try {
      const hobby = await this.hobbyRepository.findOne({
        where: { name: name },
      });
      return hobby;
    } catch (error) {
      this.logger.error('findOneHobbyByName error ',error);
    }
  }

  async findAll(): Promise<Hobby[]> {
    return this.hobbyRepository.find();
  }
}
