import { Inject, Injectable, Logger } from '@nestjs/common';
import { SaveUserCommand } from '../../commands';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class SaveUserHandler {
  private readonly logger = new Logger(SaveUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(saveUserCommand: SaveUserCommand): Promise<void> {
    try {
      await this.userRepository.save(saveUserCommand.userDto);
    } catch (error) {
      this.logger.error('SaveUserHandler error', error);
      throw error;
    }
  }
}
