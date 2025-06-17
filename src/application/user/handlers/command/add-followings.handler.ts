import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../../../../domain/user/entities/user.entity';
import { AddFollowingsCommand } from '../../commands';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class AddFollowingsHandler {
  private readonly logger = new Logger(AddFollowingsHandler.name);
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(addFollowingsCommand: AddFollowingsCommand): Promise<void> {
    try {
      await this.userRepository.addFollowings(
        addFollowingsCommand.userId,
        addFollowingsCommand.followings,
      );
    } catch (error) {
      this.logger.error(
        'AddFollowingsHandler error: Adding of Followings fail',
        error,
      );
      throw error;
    }
  }
}
