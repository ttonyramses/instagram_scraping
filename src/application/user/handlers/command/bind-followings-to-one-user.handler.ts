import { Inject, Injectable, Logger } from '@nestjs/common';
import { BindFollowingsToOneUserCommand } from '../../commands';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class BindFollowingsToOneUserHandler {
  private readonly logger = new Logger(BindFollowingsToOneUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(
    bindFollowingsToOneUserCommand: BindFollowingsToOneUserCommand,
  ): Promise<void> {
    try {
      await this.userRepository.bindFollowingsToOneUser(
        bindFollowingsToOneUserCommand.userId,
        bindFollowingsToOneUserCommand.followings,
      );
    } catch (error) {
      this.logger.error(
        'BindFollowingsToOneUserHandler error: Adding of Followings fail',
        error,
      );
      throw error;
    }
  }
}
