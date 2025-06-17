import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/user/entities/user.entity';
import { UserRepository } from '../../../domain/user/ports/user.repository.interface';
import { UserOrmEntity } from './user.orm-entity';
import { UserMapper } from './user.mapper';
import { Hobby } from '../../../domain/hobby/entities/hobby.entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  private readonly logger = new Logger(TypeOrmUserRepository.name);

  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userOrmRepository: Repository<UserOrmEntity>,
    private readonly userMapper: UserMapper,
  ) {}

  async findOneById(id: string): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { id },
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  // on general relations sera egale à ['followers', 'followings', 'hobbies']
  async findOneWithRelations(
    id: string,
    relations: string[] = [],
  ): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { id },
      relations,
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  async findAll(): Promise<User[]> {
    const usersOrm = await this.userOrmRepository.find();
    return usersOrm.map((userOrm) => this.userMapper.toDomain(userOrm));
  }

  async findAllWithAtLeastOneHobby(): Promise<User[]> {
    let userOrms = new Array<UserOrmEntity>();

    try {
      userOrms = await this.userOrmRepository
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.hobbies', 'hobby') // Utilise innerJoin pour garantir la présence de hobbies
        .select(['user', 'COUNT(hobby.id) as hobbyCount'])
        .where('user.enable = :param_enable', { param_enable: true })
        .groupBy('user.id') // Regroupe les résultats par utilisateur
        .having('COUNT(hobby.id) > 0') // S'assure que chaque utilisateur a au moins un hobby
        .getMany();
    } catch (error) {
      this.logger.error(
        'findAllWithAtLeastOneHobby Error fetching users with at least one hobby:',
        error,
      );
      return []; // Retourne un tableau vide en cas d'erreur
    }
    return userOrms.map((userOrm) => this.userMapper.toDomain(userOrm));
  }

  async findAllWithSpecificHobbies(hobbiesList: string[]): Promise<User[]> {
    let userOrms = new Array<UserOrmEntity>();
    try {
      userOrms = await this.userOrmRepository
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.hobbies', 'hobby')
        .select(['user', 'COUNT(hobby.id) as hobbyCount'])
        .where('hobby.name IN (:...hobbies) and user.enable = :param_enable', {
          hobbies: hobbiesList,
          param_enable: true,
        }) // Filtrage basé sur les noms de hobbies
        .groupBy('user.id')
        .having('COUNT(hobby.id) > 0')
        .getMany();
    } catch (error) {
      this.logger.error(
        'findAllWithSpecificHobbies Error fetching users with specific hobbies:',
        error,
      );
      return []; // Retourne un tableau vide en cas d'erreur
    }
    return userOrms.map((userOrm) => this.userMapper.toDomain(userOrm));
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

  async addFollowers(id: string, followers: User[]): Promise<void> {
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

  async addFollowings(id: string, followings: User[]): Promise<void> {
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

  async findAllWithNoFollowers(): Promise<User[]> {
    const users = await this.userOrmRepository.find({
      where: {
        hasFollowerProcess: false,
        enable: true,
      },
    });

    // Conversion de User[] en User[]
    return users.map((userOrm) => {
      return this.userMapper.toDomain(userOrm);
    });
  }

  catch(error) {
    this.logger.error('findAllWithNoFollowers error:', error);
    return [];
  }

  async findAllWithNoFollowings(): Promise<User[]> {
    try {
      const users = await this.userOrmRepository.find({
        where: {
          hasFollowingProcess: false,
          enable: true,
        },
      });

      // Conversion de User[] en User[]
      return users.map((userOrm) => {
        return this.userMapper.toDomain(userOrm);
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

  async findAllWithNoHobbies(): Promise<User[]> {
    let userOrms = new Array<UserOrmEntity>();
    try {
      // Trouver tous les utilisateurs qui n'ont aucun hobby
      userOrms = await this.userOrmRepository
        .createQueryBuilder('user')
        .leftJoin('user.hobbies', 'hobby')
        .where('hobby.id IS NULL')
        .andWhere('user.enable = :enable', { enable: true })
        .getMany();
    } catch (error) {
      this.logger.error('findAllWithNoHobbies error:', error);
      return [];
    }
    // conversion d'un tableau d'objets UserOrmEntity en tableau d'objets User
    return userOrms.map((userOrm) => this.userMapper.toDomain(userOrm));
  }

  async save(user: User): Promise<User> {
    const userOrm = this.userMapper.toOrm(user);
    const userSave = await this.userOrmRepository.save(userOrm);
    return this.userMapper.toDomain(userSave);
  }

  async saveAll(users: User[]): Promise<void> {
    await this.userOrmRepository.save(users);
  }

  async bindFollowersToOneUser(id: string, followers: User[]): Promise<void> {
    await this.userOrmRepository
      .createQueryBuilder()
      .relation(User, 'followers')
      .of(id)
      .remove(followers ?? []);

    await this.userOrmRepository
      .createQueryBuilder()
      .relation(User, 'followers')
      .of(id)
      .add(followers ?? []);
  }

  async bindFollowingsToOneUser(id: string, followings: User[]): Promise<void> {
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

  async bindHobbiesToOneUser(id: string, hobbies: Hobby[]): Promise<void> {
    await this.userOrmRepository
      .createQueryBuilder()
      .relation(User, 'hobbies')
      .of(id)
      .remove(hobbies ?? []);

    await this.userOrmRepository
      .createQueryBuilder()
      .relation(User, 'hobbies')
      .of(id)
      .add(hobbies ?? []);
  }
}
