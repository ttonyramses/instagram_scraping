import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ORM Entities
import { UserOrmEntity } from './infrastructure/persistence/user/user.orm-entity';
import { HobbyOrmEntity } from './infrastructure/persistence/hobby/hobby.orm-entity';

// Controllers
import { UserController } from './presentation/user/controllers/user.controller';

// Handlers
import { CreateUserHandler } from './application/user/handlers/create-user.handler';
import { UpdateUserHandler } from './application/user/handlers/update-user.handler';
import { GetUserHandler } from './application/user/handlers/get-user.handler';

// Infrastructure
import { UserMapper } from './infrastructure/persistence/user/user.mapper';
import { TypeOrmUserRepository } from './infrastructure/persistence/user/typeorm-user.repository';

// Interfaces

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity, HobbyOrmEntity])],
  controllers: [UserController],
  providers: [
    // Handlers
    CreateUserHandler,
    UpdateUserHandler,
    GetUserHandler,

    // Infrastructure
    UserMapper,
    {
      provide: 'UserRepository',
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: ['UserRepository'],
})
export class UserModule {}
