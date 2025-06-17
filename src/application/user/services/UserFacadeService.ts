import {
  AddFollowersCommand,
  AddFollowingsCommand,
  SaveAllUsersCommand,
  SaveUserCommand,
} from '../commands';
import { Injectable } from '@nestjs/common';
import {
  AddFollowersHandler,
  AddFollowingsHandler,
  SaveAllUsersHandler,
  SaveUserHandler,
} from '../handlers/command';
import { UserDto } from '../../../presentation/user/dto/user.dto';
import { GetOneUserQuery } from '../queries';
import { User } from '../../../domain/user/entities/user.entity';
import {
  GetAllUsersHandler,
  GetAllUsersWithNoFollowersHandler,
  GetOneUserHandler,
  GetUsersWithNoFollowingsHandler,
  GetUsersWithNoInfoHandler,
} from '../handlers/queries';

@Injectable()
export class UserFacadeService {
  constructor(
    // Command Handlers
    private readonly saveUserHandler: SaveUserHandler,
    private readonly saveAllUsersHandler: SaveAllUsersHandler,
    private readonly addFollowersHandler: AddFollowersHandler,
    private readonly addFollowingsHandler: AddFollowingsHandler,
    // Query Handlers
    private readonly getOneUserHandler: GetOneUserHandler,
    private readonly getAllUsersHandler: GetAllUsersHandler,
    private readonly getUsersWithNoInfoHandler: GetUsersWithNoInfoHandler,
    private readonly getUsersWithNoFollowersHandler: GetAllUsersWithNoFollowersHandler,
    private readonly getAllUsersWithNoFollowingsHandler: GetUsersWithNoFollowingsHandler,
  ) {}

  // Méthodes de commodité qui conservent l'interface de votre ancien service
  async save(userDto: UserDto): Promise<void> {
    const saveUserCommand = new SaveUserCommand(userDto);
    return await this.saveUserHandler.handle(saveUserCommand);
  }

  async saveAll(userDtos: UserDto[]): Promise<void> {
    const saveAllUsersCommand = new SaveAllUsersCommand(userDtos);
    return await this.saveAllUsersHandler.handle(saveAllUsersCommand);
  }

  async findOneUser(id: string): Promise<UserDto> {
    const getOneUserQuery = new GetOneUserQuery(id);
    return await this.getOneUserHandler.handle(getOneUserQuery);
  }

  async findAll(): Promise<User[]> {
    return await this.getAllUsersHandler.handle();
  }

  async findAllWithNoInfo(): Promise<User[]> {
    return await this.getUsersWithNoInfoHandler.handle();
  }

  async findAllWithNoFollowers(): Promise<UserDto[]> {
    return await this.getUsersWithNoFollowersHandler.handle();
  }

  async findAllWithNoFollowings(): Promise<UserDto[]> {
    return await this.getAllUsersWithNoFollowingsHandler.handle();
  }

  async addFollowers(id: string, followers: UserDto[]): Promise<void> {
    const addFollowersCommand = new AddFollowersCommand(id, followers);
    return await this.addFollowersHandler.handle(addFollowersCommand);
  }

  async addFollowings(id: string, followings: UserDto[]): Promise<void> {
    const addFollowingsCommand = new AddFollowingsCommand(id, followings);
    return await this.addFollowingsHandler.handle(addFollowingsCommand);
  }
}
