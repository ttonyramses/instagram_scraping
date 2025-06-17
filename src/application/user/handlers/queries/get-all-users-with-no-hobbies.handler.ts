import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../../../../domain/user/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class GetAllUsersWithNoHobbiesHandler {
  private readonly logger = new Logger(GetAllUsersWithNoHobbiesHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(): Promise<User[]> {
    try {
      return await this.userRepository.findAllWithNoHobbies();
    } catch (error) {
      this.logger.error('GetAllUsersWithNoHobbiesHandler error', error);
      throw error;
    }
  }
}
