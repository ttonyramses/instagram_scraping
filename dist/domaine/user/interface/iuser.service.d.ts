import { HobbyDto } from '../../hobby/dto/hobby.dto';
import { UserDto } from '../dto/user.dto';
import { User } from '../entity/user.entity';
export interface IUserService {
    save(userDto: UserDto): Promise<User>;
    saveAll(userDtos: UserDto[]): Promise<User[]>;
    findOneUser(id: string): Promise<User>;
    findOneUserWithRelations(id: string): Promise<User>;
    findAll(): Promise<User[]>;
    addFollowers(id: string, followers: UserDto[]): any;
    addFollowings(id: string, followings: UserDto[]): any;
    addHobbies(id: string, hobbies: HobbyDto[]): any;
}
