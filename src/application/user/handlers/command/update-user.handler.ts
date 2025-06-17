import { Inject, Injectable } from '@nestjs/common';
import { UpdateUserCommand } from '../../commands';
import { User } from '../../../../domain/user/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';
import { UserNotFoundException } from '../../../../domain/user/exceptions/user.exceptions';

@Injectable()
export class UpdateUserHandler {
  private;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async handle(updateUserCommand: UpdateUserCommand): Promise<User> {
    const user = await this.userRepository.findOneById(
      updateUserCommand.user.id,
    );
    if (!user) {
      throw new UserNotFoundException(updateUserCommand.user.id);
    }
    user.update(updateUserCommand.user);
    return await this.userRepository.save(user);
  }
}
