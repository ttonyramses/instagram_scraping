import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';
import { User } from '../../../../domain/user/entities/user.entity';

@Injectable()
export class GetAllUsersWithNoFollowingsHandler {
  private readonly logger = new Logger(GetAllUsersWithNoFollowingsHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(): Promise<User[]> {
    try {
      return await this.userRepository.findAllWithNoFollowings();
    } catch (error) {
      this.logger.error('GetAllUsersWithNoFollowingsHandler error', error);
      return [];
    }
  }
}
