import { Inject, Injectable, Logger } from '@nestjs/common';
import { GetOneUserQuery } from '../../queries';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';
import { User } from '../../../../domain/user/entities/user.entity';

@Injectable()
export class GetOneUserHandler {
  private readonly logger = new Logger(GetOneUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(getOneUserQuery: GetOneUserQuery): Promise<User | null> {
    try {
      return await this.userRepository.findOneById(getOneUserQuery.id);
    } catch (error) {
      this.logger.error('GetOneUserHandler error', error);
      throw error;
    }
  }
}
