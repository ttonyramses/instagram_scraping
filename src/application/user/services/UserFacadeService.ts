import {
  CreateUserCommand,
  SaveAllUsersCommand,
  UpdateUserCommand,
} from '../commands';
import { Injectable } from '@nestjs/common';
import {
  BindFollowersToOneUserHandler,
  BindFollowingsToOneUserHandler,
  BindHobbiesToOneUserHandler,
  CreateUserHandler,
  SaveAllUsersHandler,
  UpdateUserHandler,
} from '../handlers/command';
import { User } from '../../../domain/user/entities/user.entity';
import {
  GetAllUsersHandler,
  GetAllUsersWithAtLeastOneHobbyHandler,
  GetAllUsersWithNoFollowersHandler,
  GetAllUsersWithNoFollowingsHandler,
  GetAllUsersWithNoHobbiesHandler,
  GetAllUsersWithNoInfoHandler,
  GetAllUsersWithSpecificHobbiesHandler,
  GetOneUserHandler,
  GetOneUserWithRelationsHandler,
} from '../handlers/queries';
import { GetOneUserWithRelationsQuery } from '../queries';

@Injectable()
export class UserFacadeService {
  constructor(
    // Command Handlers
    private readonly bindFollowersToOneUserHandler: BindFollowersToOneUserHandler,
    private readonly bindFollowingsToOneUserHandler: BindFollowingsToOneUserHandler,
    private readonly bindHobbiesToOneUserHandler: BindHobbiesToOneUserHandler,
    private readonly createUserHandler: CreateUserHandler,
    private readonly saveAllUsersHandler: SaveAllUsersHandler,
    private readonly updateUserHandler: UpdateUserHandler,
    // Query Handlers
    private readonly getAllUsersHandler: GetAllUsersHandler,
    private readonly getAllUsersWithAtLeastOneHobbyHandler: GetAllUsersWithAtLeastOneHobbyHandler,
    private readonly getUsersWithNoFollowersHandler: GetAllUsersWithNoFollowersHandler,
    private readonly getAllUsersWithNoFollowingsHandler: GetAllUsersWithNoFollowingsHandler,
    private readonly getAllUsersWithNoHobbiesHandler: GetAllUsersWithNoHobbiesHandler,
    private readonly getAllUsersWithNoInfoHandler: GetAllUsersWithNoInfoHandler,
    private readonly getAllUsersWithSpecificHobbiesHandler: GetAllUsersWithSpecificHobbiesHandler,
    private readonly getOneUserHandler: GetOneUserHandler,
    private readonly getOneUserWithRelationsHandler: GetOneUserWithRelationsHandler,
  ) {}

  // Méthodes de commodité qui conservent l'interface de votre ancien service
  async createUser(user: User): Promise<User> {
    const createUserCommand = new CreateUserCommand(user);
    return await this.createUserHandler.handle(createUserCommand);
  }

  async updateUser(user: User): Promise<User> {
    const updateUserCommand = new UpdateUserCommand(user);
    return await this.updateUserHandler.handle(updateUserCommand);
  }

  async saveAll(users: User[]): Promise<void> {
    const saveAllUsersCommand = new SaveAllUsersCommand(users);
    return await this.saveAllUsersHandler.handle(saveAllUsersCommand);
  }

  async getOneUserWithRelations(
    id: string,
    relations?: string[],
  ): Promise<User> {
    const getOneUserQuery = new GetOneUserWithRelationsQuery(id, relations);
    return await this.getOneUserWithRelationsHandler.handle(getOneUserQuery);
  }

  async findAll(): Promise<User[]> {
    return await this.getAllUsersHandler.handle();
  }

  async findAllWithNoInfo(): Promise<User[]> {
    return await this.getAllUsersWithNoInfoHandler.handle();
  }

  async findAllWithNoFollowers(): Promise<User[]> {
    return await this.getUsersWithNoFollowersHandler.handle();
  }

  async findAllWithNoFollowings(): Promise<User[]> {
    return await this.getAllUsersWithNoHobbiesHandler.handle();
  }

  /* async addFollowers(id: string, followers: User[]): Promise<void> {
     const addFollowersCommand = new BindFollowersToOneUserCommand(
       id,
       followers,
     );
     return await this.bindFollowersToOneUserHandler.handle(addFollowersCommand);
   }
 
   async addFollowings(id: string, followings: User[]): Promise<void> {
     const addFollowingsCommand = new BindFollowingsToOneUserCommand(
       id,
       followings,
     );
     return await this.bindHobbiesToOneUserHandler1.handle(addFollowingsCommand);
   }*/
}
