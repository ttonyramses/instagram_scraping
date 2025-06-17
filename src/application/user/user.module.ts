import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { UserController } from '../../presentation/user/controllers/user.controller';

// Handlers
import {
  AddFollowersHandler,
  AddFollowingsHandler,
  CreateUserHandler,
  SaveAllUsersHandler,
  SaveUserHandler,
} from './handlers/command';
import {
  GetAllUsersHandler,
  GetAllUsersWithNoFollowersHandler,
  GetOneUserHandler,
  GetUsersWithNoFollowingsHandler,
  GetUsersWithNoInfoHandler,
} from './handlers/queries';
// Infrastructure
import { UserFacadeService } from './services/UserFacadeService';
import { TypeOrmUserRepository } from '../../infrastructure/persistence/user/typeorm-user.repository';
import { UserOrmEntity } from '../../infrastructure/persistence/user/user.orm-entity';
import { HobbyOrmEntity } from '../../infrastructure/persistence/hobby/hobby.orm-entity';
import { UserMapper } from '../../infrastructure/persistence/user/user.mapper';
import { USER_REPOSITORY } from '../../domain/user/ports/user.repository.interface';

// Interfaces

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity, HobbyOrmEntity])],
  providers: [
    // Command Handlers
    SaveUserHandler,
    SaveAllUsersHandler,
    AddFollowersHandler,
    AddFollowingsHandler,
    CreateUserHandler,

    // Query Handlers
    GetAllUsersHandler,
    GetOneUserHandler,
    GetUsersWithNoInfoHandler,
    GetAllUsersWithNoFollowersHandler,
    GetUsersWithNoFollowingsHandler,

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
