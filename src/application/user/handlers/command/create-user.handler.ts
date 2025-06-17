import { Inject, Injectable } from '@nestjs/common';
import { CreateUserCommand } from '../../commands';
import { User } from '../../../../domain/user/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';
import { UserAlreadyExistsException } from '../../../../domain/user/exceptions/user.exceptions';

@Injectable()
export class CreateUserHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(createUserCommand: CreateUserCommand): Promise<User> {
    const existingUser = await this.userRepository.findOneById(
      createUserCommand.user.id,
    );
    if (existingUser) {
      throw new UserAlreadyExistsException(createUserCommand.user.id);
    }
    return await this.userRepository.save(createUserCommand.user);
  }
}
