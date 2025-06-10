import { Inject, Injectable } from "@nestjs/common";
import { GetUserQuery } from '../queries/get-user.query';
import { User } from '../../../domain/user/entities/user.entity';
import { UserRepository } from '../../../domain/user/ports/user.repository.interface';
import { UserNotFoundException } from '../../../domain/user/exceptions/user.exceptions';

@Injectable()
export class GetUserHandler {
  constructor(@Inject('UserRepository') private readonly userRepository: UserRepository) {}

  async handle(query: GetUserQuery): Promise<User> {
    const user = await this.userRepository.findById(query.id);
    if (!user) {
      throw new UserNotFoundException(query.id);
    }
    return user;
  }
}
