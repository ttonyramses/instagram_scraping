import { Inject, Injectable } from '@nestjs/common';
import { UpdateUserCommand } from '../../commands/update-user.command';
import { User } from '../../../../domain/user/entities/user.entity';
import { UserRepository } from '../../../../domain/user/ports/user.repository.interface';
import { UserNotFoundException } from '../../../../domain/user/exceptions/user.exceptions';

@Injectable()
export class UpdateUserHandler {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async handle(command: UpdateUserCommand): Promise<void> {
    const user = await this.userRepository.findById(command.id);
    if (!user) {
      throw new UserNotFoundException(command.id);
    }

    user.updateProfile(command.name, command.biography, command.category);

    return await this.userRepository.save(user);
  }
}
