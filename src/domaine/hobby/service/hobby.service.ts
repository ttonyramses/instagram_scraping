import { inject, injectable } from 'inversify';
import { IHobbyService } from '../interface/ihobby.service';
import { TYPES } from '../../../core/type.core';
import { Logger } from 'winston';
import { IDatabaseService } from '../../../core/interface/idatabase.service';
import { HobbyDto } from '../dto/hobby.dto';
import { Hobby } from '../entity/hobby.entity';

@injectable()
export class HobbyService implements IHobbyService {
  constructor(
    @inject(TYPES.IDatabaseService) private readonly database: IDatabaseService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {}

  async findAll(): Promise<HobbyDto[]> {
    return this.database.find(Hobby);
  }

  async findOne(id: number): Promise<HobbyDto> {
    return this.database.findOne(Hobby, { where: { id } });
  }

  async create(hobbyDto: HobbyDto): Promise<HobbyDto> {
    return this.database.save(Hobby, hobbyDto);
  }

  async update(id: number, hobbyDto: HobbyDto): Promise<HobbyDto> {
    await this.database.update(Hobby, id, hobbyDto);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.database.delete(Hobby, id);
  }
} 