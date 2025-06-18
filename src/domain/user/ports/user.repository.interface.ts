import { User } from '../entities/user.entity';
import { Hobby } from '../../hobby/entities/hobby.entity';
import { Paginated, PaginateQuery } from 'nestjs-paginate';

export const USER_REPOSITORY = Symbol('UserRepository');

export interface UserRepository {
  findOneById(id: string): Promise<User | null>;

  findOneWithRelations(id: string, relations?: string[]): Promise<User | null>;

  findAll(): Promise<User[]>;

  findAllPaginated(query: PaginateQuery): Promise<Paginated<User>>;

  findAllWithAtLeastOneHobby(): Promise<User[]>;

  findAllWithSpecificHobbies(hobbiesList: string[]): Promise<User[]>;

  findAllWithNoInfo(): Promise<User[]>;

  findAllWithNoFollowers(): Promise<User[]>;

  findAllWithNoFollowings(): Promise<User[]>;

  findAllWithNoHobbies(): Promise<User[]>;

  save(user: User): Promise<User>;

  saveAll(users: User[]): Promise<void>;

  bindFollowersToOneUser(id: string, followers: User[]): Promise<void>;

  bindFollowingsToOneUser(id: string, followings: User[]): Promise<void>;

  bindHobbiesToOneUser(id: string, hobbies: Hobby[]): Promise<void>;
}
