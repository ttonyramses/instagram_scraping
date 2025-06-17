import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../../domain/user/entities/user.entity';
import { Repository } from 'typeorm';
import { SaveAllUsersCommand } from '../../commands';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class SaveAllUsersHandler {
  private readonly logger = new Logger(SaveAllUsersHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(saveAllUsersCommand: SaveAllUsersCommand): Promise<void> {
    try {
      await this.userRepository.saveAll(saveAllUsersCommand.userDtos);
    } catch (error) {
      this.logger.error('SaveUsersHandler error', error);
      throw error;
    }
  }
}
