import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';
import { BindHobbiesToOneUserCommand } from '../../commands/bind-hobbies-to-one-user.command';

@Injectable()
export class BindHobbiesToOneUserHandler {
  private readonly logger = new Logger(BindHobbiesToOneUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(
    bindHobbiesToOneUserCommand: BindHobbiesToOneUserCommand,
  ): Promise<void> {
    try {
      await this.userRepository.bindHobbiesToOneUser(
        bindHobbiesToOneUserCommand.userId,
        bindHobbiesToOneUserCommand.hobbies,
      );
    } catch (error) {
      this.logger.error('BindHobbiesToOneUserHandler error', error);
      throw error;
    }
  }
}
