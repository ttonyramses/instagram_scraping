import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../../../../presentation/user/dto/user.dto';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class GetAllUsersWithNoFollowersHandler {
  private readonly logger = new Logger(GetAllUsersWithNoFollowersHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(): Promise<UserDto[]> {
    try {
      return await this.userRepository.findAllWithNoFollowers();
    } catch (error) {
      this.logger.error('FindAllUsersWithNoFollowersHandler error', error);
      return [];
    }
  }
}
