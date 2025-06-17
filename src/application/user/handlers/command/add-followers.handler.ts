import { Inject, Injectable, Logger } from '@nestjs/common';
import { AddFollowersCommand } from '../../commands';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class AddFollowersHandler {
  private readonly logger = new Logger(AddFollowersHandler.name);
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(addFollowersCommand: AddFollowersCommand): Promise<void> {
    try {
      await this.userRepository.addFollowers(
        addFollowersCommand.userId,
        addFollowersCommand.followers,
      );
    } catch (error) {
      this.logger.error('AddFollowersHandler error', error);
      throw error;
    }
  }
}
