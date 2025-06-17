import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/user/entities/user.entity';
import { UserRepository } from '../../../domain/user/ports/user.repository.interface';
import { UserOrmEntity } from './user.orm-entity';
import { UserMapper } from './user.mapper';
import { UserDto } from '../../../presentation/user/dto/user.dto';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  private readonly logger = new Logger(TypeOrmUserRepository.name);
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userOrmRepository: Repository<UserOrmEntity>,
    private readonly userMapper: UserMapper,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { id },
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  async findWithRelations(
    id: string,
    relations: string[] = [],
  ): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { id },
      relations,
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  async findByInstagramId(instagramId: number): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { instagramId },
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  async findByFacebookId(facebookId: number): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { facebookId },
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  async findAll(): Promise<User[]> {
    const usersOrm = await this.userOrmRepository.find();
    return usersOrm.map((userOrm) => this.userMapper.toDomain(userOrm));
  }

  async save(userDto: UserDto): Promise<void> {
    const user = await this.userOrmRepository.findOne({
      where: { id: userDto.id },
    });
    if (user) {
      await this.userOrmRepository.update(userDto.id, userDto);
    } else {
      await this.userOrmRepository.save(userDto);
    }
  }

  async delete(id: string): Promise<void> {
    await this.userOrmRepository.delete({ id });
  }

  async findByCategory(category: string): Promise<User[]> {
    const usersOrm = await this.userOrmRepository.find({
      where: { category },
    });
    return usersOrm.map((userOrm) => this.userMapper.toDomain(userOrm));
  }

  async findActiveUsers(): Promise<User[]> {
    const usersOrm = await this.userOrmRepository.find({
      where: { enable: true },
    });
    return usersOrm.map((userOrm) => this.userMapper.toDomain(userOrm));
  }

  async addFollowers(id: string, followers: UserDto[]): Promise<void> {
    await this.userOrmRepository
      .createQueryBuilder()
      .relation(UserOrmEntity, 'followers')
      .of(id)
      .remove(followers ?? []);

    await this.userOrmRepository
      .createQueryBuilder()
      .relation(UserOrmEntity, 'followers')
      .of(id)
      .add(followers ?? []);
  }

  async addFollowings(id: string, followings: UserDto[]): Promise<void> {
    await this.userOrmRepository
      .createQueryBuilder()
      .relation(User, 'followings')
      .of(id)
      .remove(followings ?? []);

    await this.userOrmRepository
      .createQueryBuilder()
      .relation(User, 'followings')
      .of(id)
      .add(followings ?? []);
  }

  async findAllWithNoFollowers(): Promise<UserDto[]> {
    const users = await this.userOrmRepository.find({
      where: {
        hasFollowerProcess: false,
        enable: true,
      },
    });

    // Conversion de User[] en UserDto[]
    return users.map((user) => {
      const userDto = new UserDto();
      Object.assign(userDto, user);
      return userDto;
    });
  }
  catch(error) {
    this.logger.error('findAllWithNoFollowers error:', error);
    return [];
  }

  async findAllWithNoFollowings(): Promise<UserDto[]> {
    try {
      const users = await this.userOrmRepository.find({
        where: {
          hasFollowingProcess: false,
          enable: true,
        },
      });

      // Conversion de User[] en UserDto[]
      return users.map((user) => {
        const userDto = new UserDto();
        Object.assign(userDto, user);
        return userDto;
      });
    } catch (error) {
      this.logger.error('findAllWithNoFollowings error:', error);
      return [];
    }
  }

  async findAllWithNoInfo(): Promise<User[]> {
    const usersOrm = await this.userOrmRepository.find({
      where: {
        hasInfo: false,
        enable: true,
      },
    });
    return usersOrm.map((userOrm) => this.userMapper.toDomain(userOrm));
  }

  async findOneUser(pseudo: string): Promise<UserDto> {
    try {
      return await this.userOrmRepository.findOne({
        where: { id: pseudo },
      });
    } catch (error) {
      this.logger.error('findOneUser', error);
    }
  }

  async saveAll(userDtos: UserDto[]): Promise<void> {
    await this.userOrmRepository.save(userDtos);
  }
}
