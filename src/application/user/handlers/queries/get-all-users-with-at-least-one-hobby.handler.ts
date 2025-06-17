import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../../../../domain/user/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class GetAllUsersWithAtLeastOneHobbyHandler {
  private readonly logger = new Logger(
    GetAllUsersWithAtLeastOneHobbyHandler.name,
  );

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(): Promise<User[]> {
    try {
      return await this.userRepository.findAllWithAtLeastOneHobby();
    } catch (error) {
      this.logger.error('GetAllUsersWithAtLeastOneHobbyHandler error', error);
      throw error;
    }
  }
}
