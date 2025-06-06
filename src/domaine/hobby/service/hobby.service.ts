import {id, inject, injectable} from 'inversify';
import { IHobbyService } from '../interface/ihobby.service';
import { TYPES } from '../../../core/type.core';
import { Logger } from 'winston';
import { IdatabaseCoreService } from '../../../core/interface/idatabase.core.service';
import { HobbyDto } from '../dto/hobby.dto';
import { Hobby } from '../entity/hobby.entity';
import {Repository} from "typeorm";
import {IDatabaseService} from "../../../database/interface/idatabase.service";

@injectable()
export class HobbyService implements IHobbyService {
  private hobbyRepository: Repository<Hobby>;
  constructor(
    @inject(TYPES.IDatabaseService) private readonly database: IDatabaseService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {
    this.hobbyRepository = this.database.getRepository(Hobby);
  }

  async findAll(): Promise<HobbyDto[]> {
    return this.hobbyRepository.find();
  }

  async findOne(id: number): Promise<HobbyDto> {
    try {
      return await this.hobbyRepository.findOne({
        where: { id: id },
      });
    } catch (error) {
      this.logger.error('findOneHobby', error);
    }
  }

  async create(hobbyDto: HobbyDto): Promise<HobbyDto> {
    return this.hobbyRepository.save(hobbyDto)
  }

  async update(id: number, hobbyDto: HobbyDto): Promise<HobbyDto> {
    await this.hobbyRepository.update(id,hobbyDto);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.hobbyRepository.delete(id);
  }

  async findByName(name: string): Promise<HobbyDto> {
    try {
      return await this.hobbyRepository.findOne({
        where: { name: name },
      });
    } catch (error) {
      this.logger.error('findOneHobby', error);
    }

  }

  save(hobbyDto: HobbyDto): Promise<Hobby> {
    return this.hobbyRepository.save(hobbyDto);
  }

} 