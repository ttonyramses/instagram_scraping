import { User } from '../entities/user.entity';
import { UserDto } from '../../../presentation/user/dto/user.dto';
export const USER_REPOSITORY = Symbol('UserRepository');
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findWithRelations(id: string, relations?: string[]): Promise<User | null>;
  save(userDto: UserDto): Promise<void>;
  saveAll(userDtos: UserDto[]): Promise<void>;
  findAllWithNoInfo(): Promise<User[]>;
  findAllWithNoFollowers(): Promise<UserDto[]>;
  findAllWithNoFollowings(): Promise<UserDto[]>;
  findOneUser(pseudo: string): Promise<UserDto>;
  addFollowers(id: string, users: UserDto[]): Promise<void>;
  addFollowings(id: string, users: UserDto[]): Promise<void>;
  //addHobbies(id: string, hobbies: HobbyDto[]): Promise<void>;
  //delete(id: string): Promise<void>;
  //findByCategory(category: string): Promise<User[]>;
  //findActiveUsers(): Promise<User[]>;//find(options?: any): Promise<User[]>;
  //findByInstagramId(instagramId: number): Promise<User | null>;
  //findByFacebookId(facebookId: number): Promise<User | null>;
}
