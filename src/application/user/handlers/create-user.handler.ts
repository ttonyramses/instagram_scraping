import { Inject, Injectable } from "@nestjs/common";
import { CreateUserCommand } from '../commands/create-user.command';
import { User } from '../../../domain/user/entities/user.entity';
import { UserRepository } from '../../../domain/user/ports/user.repository.interface';
import { UserAlreadyExistsException } from '../../../domain/user/exceptions/user.exceptions';

@Injectable()
export class CreateUserHandler {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async handle(command: CreateUserCommand): Promise<User> {
    const existingUser = await this.userRepository.findById(command.id);
    if (existingUser) {
      throw new UserAlreadyExistsException(command.id);
    }

    const user = User.create(command.id, {
      name: command.name,
      biography: command.biography,
      instagramId: command.instagramId,
      facebookId: command.facebookId,
      category: command.category,
      externalUrl: command.externalUrl,
      profileUrl: command.profileUrl,
    });

    return await this.userRepository.save(user);
  }
}
