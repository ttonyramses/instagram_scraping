import { Inject, Injectable, Logger } from '@nestjs/common';
import { BindFollowersToOneUserCommand } from '../../commands';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class BindFollowersToOneUserHandler {
  private readonly logger = new Logger(BindFollowersToOneUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(
    bindFollowersToOneUserCommand: BindFollowersToOneUserCommand,
  ): Promise<void> {
    try {
      await this.userRepository.bindFollowersToOneUser(
        bindFollowersToOneUserCommand.userId,
        bindFollowersToOneUserCommand.followers,
      );
    } catch (error) {
      this.logger.error('BindFollowersToOneUserHandler error', error);
      throw error;
    }
  }
}
