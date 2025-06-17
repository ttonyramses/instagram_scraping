import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../../../../domain/user/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';
import { GetAllUsersWithSpecificHobbiesQuery } from '../../queries/get-all-users-with-specific-hobbies.query';

@Injectable()
export class GetAllUsersWithSpecificHobbiesHandler {
  private readonly logger = new Logger(
    GetAllUsersWithSpecificHobbiesHandler.name,
  );

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(
    getAllUsersWithSpecificHobbiesQuery: GetAllUsersWithSpecificHobbiesQuery,
  ): Promise<User[]> {
    try {
      return await this.userRepository.findAllWithSpecificHobbies(
        getAllUsersWithSpecificHobbiesQuery.hobbiesList,
      );
    } catch (error) {
      this.logger.error('GetAllUsersWithSpecificHobbiesHandler error', error);
      throw error;
    }
  }
}
