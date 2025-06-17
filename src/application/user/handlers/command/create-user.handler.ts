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

  async handle(command: CreateUserCommand): Promise<User> {
    const existingUser = await this.userRepository.findById(command.id);
    if (existingUser) {
      throw new UserAlreadyExistsException(command.id);
    }

    const user = User.create(command.id, {
      name: command.name,
      biography: command.biography,
      json: command.json,
      nbFollowers: command.nbFollowers,
      nbFollowings: command.nbFollowings,
      nbPublications: command.nbPublications,
      instagramId: command.instagramId,
      facebookId: command.facebookId,
      category: command.category,
      externalUrl: command.externalUrl,
      profileUrl: command.profileUrl,
      hasInfo: command.hasInfo,
      hasFollowerProcess: command.hasFollowerProcess,
      hasFollowingProcess: command.hasFollowingProcess,
      enable: command.enable,
      maxIdFollower: command.maxIdFollower,
      maxIdFollowing: command.maxIdFollowing,
    });

    await this.userRepository.save(user);
    return user;
  }
}
