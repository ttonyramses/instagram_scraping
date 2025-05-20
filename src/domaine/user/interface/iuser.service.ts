import { HobbyDto } from '../../hobby/dto/hobby.dto';
import { UserDto } from '../dto/user.dto';
import { User } from '../entity/user.entity';

export interface IUserService {
  save(userDto: UserDto): Promise<void>;
  saveAll(userDtos: UserDto[]): Promise<void>;
  findOneUser(id: string): Promise<User>;
  findOneUserWithRelations(id: string): Promise<User>;
  findAll(): Promise<User[]>;
  findAllWithNoInfo(): Promise<User[]>;
  findUsersWithAtLeastOneHobby(): Promise<User[]>;
  findUsersWithSpecificHobbies(hobbiesList: string[]): Promise<User[]>;
  findAllWithNoFollowers(): Promise<UserDto[]>;
  findAllWithNoFollowings(): Promise<UserDto[]>;
  findAllWithNoHobbies(): Promise<UserDto[]>;
  findOneUser(pseudo: string): Promise<UserDto>;
  addFollowers(pseudo: string, users: UserDto[]): Promise<void>;
  addFollowings(pseudo: string, users: UserDto[]): Promise<void>;
  addHobbies(pseudo: string, ushobbies: HobbyDto[]): Promise<void>;
}
