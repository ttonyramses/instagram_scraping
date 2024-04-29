import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';
import { IUserService } from '../interface/iuser.service';
import { IDatabaseService } from '../../../database/interface/idatabase.service';
import { HobbyDto } from '../../hobby/dto/hobby.dto';
export declare class UserService implements IUserService {
    private readonly database;
    private userRepository;
    constructor(database: IDatabaseService);
    save(userDto: UserDto): Promise<User>;
    saveAll(userDtos: UserDto[]): Promise<User[]>;
    findOneUser(id: string): Promise<User>;
    findOneUserWithRelations(id: string): Promise<User>;
    findAll(): Promise<User[]>;
    addFollowers(id: string, followers: UserDto[]): Promise<void>;
    addFollowings(id: string, followings: UserDto[]): Promise<void>;
    addHobbies(id: string, hobbies: HobbyDto[]): Promise<void>;
}
