import { Inject, Injectable, Logger } from '@nestjs/common';
import { Paginated } from 'nestjs-paginate';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';
import { User } from '../../../../domain/user/entities/user.entity';
import { GetAllUsersPageQuery } from '../../queries/get-all-users-page.query';

@Injectable()
export class GetAllUsersPageHandler {
  private readonly logger = new Logger(GetAllUsersPageHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(
    getAllUsersQuery: GetAllUsersPageQuery,
  ): Promise<Paginated<User>> {
    try {
      return await this.userRepository.findAllPaginated(
        getAllUsersQuery.paginateQuery,
      );
    } catch (error) {
      this.logger.error('GetAllUsersPageHandler error', error);
      throw error;
    }
  }
}
