import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../../../../presentation/user/dto/user.dto';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class GetUsersWithNoFollowingsHandler {
  private readonly logger = new Logger(GetUsersWithNoFollowingsHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(): Promise<UserDto[]> {
    try {
      return await this.userRepository.findAllWithNoFollowings();
    } catch (error) {
      this.logger.error('FindAllUsersWithNoFollowingsHandler error', error);
      return [];
    }
  }
}
