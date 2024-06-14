import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';
import { IUserService } from '../interface/iuser.service';
import { IDatabaseService } from '../../../database/interface/idatabase.service';
import { TYPES } from '../../../core/type.core';
import { HobbyDto } from '../../hobby/dto/hobby.dto';
import { Logger } from 'winston';

@injectable()
export class UserService implements IUserService {
  private userRepository: Repository<User>;

  constructor(
    @inject(TYPES.IDatabaseService) private readonly database: IDatabaseService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {
    this.userRepository = database.getRepository(User);
  }

  async save(userDto: UserDto): Promise<User> {
    return this.userRepository.save(userDto);
  }

  async saveAll(userDtos: UserDto[]): Promise<User[]> {
    return this.userRepository.save(userDtos);
  }

  async findOneUser(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
      });
      return user;
    } catch (error) {
      this.logger.error('findOneUser', error);
    }
  }

  async findOneUserWithRelations(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOneOrFail({
        where: { id: id },
        relations: ['followers', 'followings', 'hobbies'],
      });
      return user;
    } catch (error) {
      this.logger.error('findOneUserWithRelations error', error);
    }
  }

  async findUsersWithAtLeastOneHobby(): Promise<User[]> {
    try {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.hobbies', 'hobby') // Utilise innerJoin pour garantir la présence de hobbies
        .select(['user', 'COUNT(hobby.id) as hobbyCount'])
        .groupBy('user.id') // Regroupe les résultats par utilisateur
        .having('COUNT(hobby.id) > 0') // S'assure que chaque utilisateur a au moins un hobby
        .getMany();

      return users;
    } catch (error) {
      this.logger.error('findUsersWithAtLeastOneHobby Error fetching users with at least one hobby:', error);
      return []; // Retourne un tableau vide en cas d'erreur
    }
  }

  async findUsersWithSpecificHobbies(hobbiesList: string[]): Promise<User[]> {
    try {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.hobbies', 'hobby')
        .select(['user', 'COUNT(hobby.id) as hobbyCount'])
        .where('hobby.name IN (:...hobbies)', { hobbies: hobbiesList }) // Filtrage basé sur les noms de hobbies
        .groupBy('user.id')
        .having('COUNT(hobby.id) > 0')
        .getMany();

      return users;
    } catch (error) {
      this.logger.error('findUsersWithSpecificHobbies Error fetching users with specific hobbies:', error);
      return []; // Retourne un tableau vide en cas d'erreur
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        enable: true
      },
    });
  }

  async findAllWithNoInfo(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        hasInfo: false,
        enable: true
      },
    });
  }

  async addFollowers(id: string, followers: UserDto[]) {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'followers')
      .of(id)
      .remove(followers ?? []);

    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'followers')
      .of(id)
      .add(followers ?? []);
  }

  async addFollowings(id: string, followings: UserDto[]) {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'followings')
      .of(id)
      .remove(followings ?? []);

    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'followings')
      .of(id)
      .add(followings ?? []);
  }

  async addHobbies(id: string, hobbies: HobbyDto[]) {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'hobbies')
      .of(id)
      .remove(hobbies ?? []);

    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'hobbies')
      .of(id)
      .add(hobbies ?? []);
  }
}
