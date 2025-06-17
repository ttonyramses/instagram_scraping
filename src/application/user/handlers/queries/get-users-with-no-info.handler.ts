import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../../../../domain/user/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';

@Injectable()
export class GetUsersWithNoInfoHandler {
  private readonly logger = new Logger(GetUsersWithNoInfoHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(): Promise<User[]> {
    try {
      return await this.userRepository.findAllWithNoInfo();
    } catch (error) {
      this.logger.error('FindAllUsersWithNoInfoHandler error', error);
      throw error;
    }
  }
}
