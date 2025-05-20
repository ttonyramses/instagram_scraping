import { HobbyDto } from '../../hobby/dto/hobby.dto';
import { UserDto } from '../dto/user.dto';
import { User } from '../entity/user.entity';

export interface IUserService {
  findByPseudo(pseudo: string): unknown;
  addHobby(id: any, id1: number): unknown;
  save(userDto: UserDto): Promise<User>;
  saveAll(userDtos: UserDto[]): Promise<User[]>;
  findOneUser(id: string): Promise<User>;
  findOneUserWithRelations(id: string): Promise<User>;
  findAll(): Promise<User[]>;
  findAllWithNoInfo(): Promise<User[]>;
  findUsersWithAtLeastOneHobby(): Promise<User[]>;
  findUsersWithSpecificHobbies(hobbiesList: string[]): Promise<User[]>;
  addFollowers(id: string, followers: UserDto[]);
  addFollowings(id: string, followings: UserDto[]);
  addHobbies(id: string, hobbies: HobbyDto[]);
  findAllWithNoFollowers(): Promise<UserDto[]>;
  findAllWithNoFollowings(): Promise<UserDto[]>;
  findAllWithNoHobbies(): Promise<UserDto[]>;
  findOneUser(pseudo: string): Promise<UserDto>;
  save(user: UserDto): Promise<void>;
  saveFollowers(pseudo: string, followers: string[]): Promise<void>;
  saveFollowings(pseudo: string, followings: string[]): Promise<void>;
  saveHobbies(pseudo: string, hobbies: string[]): Promise<void>;
  addFollowers(pseudo: string, users: UserDto[]): Promise<void>;
  addFollowings(pseudo: string, users: UserDto[]): Promise<void>;
  addHobbies(pseudo: string, users: UserDto[]): Promise<void>;
}
