import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { UserController } from '../../presentation/user/controllers/user.controller';

// Handlers
import {
  BindFollowersToOneUserHandler,
  BindFollowingsToOneUserHandler,
  BindHobbiesToOneUserHandler,
  CreateUserHandler,
  SaveAllUsersHandler,
  UpdateUserHandler,
} from './handlers/command';
import {
  GetAllUsersHandler,
  GetAllUsersWithNoFollowersHandler,
  GetOneUserHandler,
  GetAllUsersWithNoFollowingsHandler,
  GetAllUsersWithNoInfoHandler,
  GetAllUsersWithNoHobbiesHandler,
  GetAllUsersWithSpecificHobbiesHandler,
  GetOneUserWithRelationsHandler,
  GetAllUsersWithAtLeastOneHobbyHandler,
} from './handlers/queries';
// Infrastructure
import { UserFacadeService } from './services/UserFacadeService';
import { TypeOrmUserRepository } from '../../infrastructure/persistence/user/typeorm-user.repository';
import { UserOrmEntity } from '../../infrastructure/persistence/user/user.orm-entity';
import { HobbyOrmEntity } from '../../infrastructure/persistence/hobby/hobby.orm-entity';
import { UserMapper } from '../../infrastructure/persistence/user/user.mapper';
import { USER_REPOSITORY } from '../../domain/user/ports/user.repository.interface';
import { UserDtoMapper } from '../../presentation/user/dto/user.dto.mapper';
import { GetAllUsersPageHandler } from './handlers/queries/get-all-users-page-handler';

// Interfaces

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity, HobbyOrmEntity])],
  providers: [
    // Command Handlers
    BindFollowersToOneUserHandler,
    BindFollowingsToOneUserHandler,
    BindHobbiesToOneUserHandler,
    CreateUserHandler,
    SaveAllUsersHandler,
    UpdateUserHandler,

    // Query Handlers
    GetAllUsersHandler,
    GetAllUsersWithNoFollowersHandler,
    GetAllUsersWithNoFollowingsHandler,
    GetAllUsersWithNoHobbiesHandler,
    GetAllUsersWithNoInfoHandler,
    GetAllUsersWithSpecificHobbiesHandler,
    GetOneUserHandler,
    GetOneUserWithRelationsHandler,
    GetAllUsersWithAtLeastOneHobbyHandler,
    GetAllUsersPageHandler,

    //Presentation
    UserDtoMapper,

    // Infrastructure
    UserMapper,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },

    // Facade Service
    UserFacadeService,
  ],
  controllers: [UserController],
  exports: [],
})
export class UserModule {}
