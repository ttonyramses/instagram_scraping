import { Inject, Injectable, Logger } from '@nestjs/common';
import { GetOneUserQuery } from '../../queries';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../domain/user/ports/user.repository.interface';
import { User } from '../../../../domain/user/entities/user.entity';
import { GetOneUserWithRelationsQuery } from '../../queries/get-one-user-with-relations.query';

@Injectable()
export class GetOneUserWithRelationsHandler {
  private readonly logger = new Logger(GetOneUserWithRelationsHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(
    getOneUserWithRelationsQuery: GetOneUserWithRelationsQuery,
  ): Promise<User | null> {
    try {
      return await this.userRepository.findOneWithRelations(
        getOneUserWithRelationsQuery.id,
        getOneUserWithRelationsQuery.relations,
      );
    } catch (error) {
      this.logger.error('GetOneUserWithRelationsHandler error', error);
      throw error;
    }
  }
}
