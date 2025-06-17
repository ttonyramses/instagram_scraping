import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../../../../domain/user/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class GetAllUsersHandler {
  private readonly logger = new Logger(GetAllUsersHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(): Promise<User[]> {
    try {
      return await this.userRepository.findAll();
    } catch (error) {
      this.logger.error('FindAllUsersHandler error', error);
      throw error;
    }
  }
}
