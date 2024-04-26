import { UserDto } from '../dto/user.dto';
import { User } from '../entity/user.entity';

export interface IUserService {
  createOrUpdate(userDto: UserDto): Promise<User>;
  findOneUser(id: string): Promise<User>;
  findAll(): Promise<User[]>;
}
