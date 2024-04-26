import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';
import { IUserService } from '../interface/iuser.service';
import { IDatabaseService } from '../../../database/interface/idatabase.service';
import { TYPES } from '../../../core/type.core';

@injectable()
export class UserService implements IUserService {
  private userRepository: Repository<User>;

  constructor( @inject(TYPES.IDatabaseService) private readonly database: IDatabaseService ) {
    this.userRepository = database.getRepository(User);
  }

  async createOrUpdate(userDto: UserDto): Promise<User> {
    return this.userRepository.save(userDto);
  }

  async findOneUser(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOneOrFail({
        where: { id: id },
      });
      return user;
    } catch (error) {
      console.log(error);
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
