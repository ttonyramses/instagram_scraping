import { Inject, Injectable, Logger } from '@nestjs/common';
import { GetOneUserQuery } from '../../queries';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';
import { UserDto } from '../../../../presentation/user/dto/user.dto';

@Injectable()
export class GetOneUserHandler {
  private readonly logger = new Logger(GetOneUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(getOneUserQuery: GetOneUserQuery): Promise<UserDto | null> {
    try {
      return await this.userRepository.findOneUser(getOneUserQuery.id);
    } catch (error) {
      this.logger.error('FindOneUserHandler error', error);
      throw error;
    }
  }
}
