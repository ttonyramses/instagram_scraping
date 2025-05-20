import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';
import { IUserService } from '../interface/iuser.service';
import { IDatabaseService } from '../../../database/interface/idatabase.service';
import { TYPES } from '../../../core/type.core';
import { Logger } from 'winston';
import { HobbyDto } from '../../hobby/dto/hobby.dto';

@injectable()
export class UserService implements IUserService {
  private userRepository: Repository<User>;

  constructor(
    @inject(TYPES.IDatabaseService) private readonly database: IDatabaseService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {
    this.userRepository = database.getRepository(User);
  }

  async save(userDto: UserDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userDto.id },
    });
    if (user) {
      await this.userRepository.update(userDto.id, userDto);
    } else {
      await this.userRepository.save(userDto);
    }
  }

  async saveAll(userDtos: UserDto[]): Promise<void> {
    await this.userRepository.save(userDtos);
  }

  async findOneUser(id: string): Promise<User> {
    try {
      return await this.userRepository.findOne({
        where: { id: id },
      });
    } catch (error) {
      this.logger.error('findOneUser', error);
    }
  }

  async findOneUserWithRelations(id: string): Promise<User> {
    try {
      return await this.userRepository.findOneOrFail({
        where: { id: id },
        relations: ['followers', 'followings', 'hobbies'],
      });
    } catch (error) {
      this.logger.error('findOneUserWithRelations error', error);
    }
  }

  async findUsersWithAtLeastOneHobby(): Promise<User[]> {
    try {
      return await this.userRepository
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.hobbies', 'hobby') // Utilise innerJoin pour garantir la présence de hobbies
        .select(['user', 'COUNT(hobby.id) as hobbyCount'])
        .where('user.enable = :param_enable', { param_enable: true })
        .groupBy('user.id') // Regroupe les résultats par utilisateur
        .having('COUNT(hobby.id) > 0') // S'assure que chaque utilisateur a au moins un hobby
        .getMany();
    } catch (error) {
      this.logger.error(
        'findUsersWithAtLeastOneHobby Error fetching users with at least one hobby:',
        error,
      );
      return []; // Retourne un tableau vide en cas d'erreur
    }
  }

  async findUsersWithSpecificHobbies(hobbiesList: string[]): Promise<User[]> {
    try {
      return await this.userRepository
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
        'findUsersWithSpecificHobbies Error fetching users with specific hobbies:',
        error,
      );
      return []; // Retourne un tableau vide en cas d'erreur
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        enable: true,
      },
    });
  }

  async findAllWithNoInfo(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        hasInfo: false,
        enable: true,
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

  async addHobbies(pseudo: string, hobbies: HobbyDto[]): Promise<void> {
    const user = await this.findOneUser(pseudo);
    if (!user) {
      throw new Error(`User ${pseudo} not found`);
    }
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'hobbies')
      .of(pseudo)
      .remove(hobbies ?? []);

    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'hobbies')
      .of(pseudo)
      .add(hobbies ?? []);
  }

  async findAllWithNoFollowers(): Promise<UserDto[]> {
    try {
      const users = await this.userRepository.find({
        where: {
          hasFollowerProcess: false,
          enable: true,
        },
      });

      // Conversion de User[] en UserDto[]
      return users.map(user => {
        const userDto = new UserDto();
        Object.assign(userDto, user);
        return userDto;
      });
    } catch (error) {
      this.logger.error('findAllWithNoFollowers error:', error);
      return [];
    }
  }

  async findAllWithNoFollowings(): Promise<UserDto[]> {
    try {
      const users = await this.userRepository.find({
        where: {
          hasFollowingProcess: false,
          enable: true,
        },
      });

      // Conversion de User[] en UserDto[]
      return users.map(user => {
        const userDto = new UserDto();
        Object.assign(userDto, user);
        return userDto;
      });
    } catch (error) {
      this.logger.error('findAllWithNoFollowings error:', error);
      return [];
    }
  }

  async findAllWithNoHobbies(): Promise<UserDto[]> {
    try {
      // Trouver tous les utilisateurs qui n'ont aucun hobby
      const users = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.hobbies', 'hobby')
        .where('hobby.id IS NULL')
        .andWhere('user.enable = :enable', { enable: true })
        .getMany();

      // Conversion de User[] en UserDto[]
      return users.map(user => {
        const userDto = new UserDto();
        Object.assign(userDto, user);
        return userDto;
      });
    } catch (error) {
      this.logger.error('findAllWithNoHobbies error:', error);
      return [];
    }
  }

  async saveFollowers(pseudo: string, followers: string[]): Promise<void> {
    try {
      if (!followers || followers.length === 0) {
        return;
      }

      // Trouver l'utilisateur concerné
      const user = await this.findOneUser(pseudo);
      if (!user) {
        throw new Error(`User ${pseudo} not found`);
      }

      // Marquer comme traité
      await this.userRepository.update(pseudo, { hasFollowerProcess: true });

      // Créer les DTOs pour les followers
      const followerDtos = await Promise.all(followers.map(async (followerId) => {
        // Vérifier si le follower existe déjà
        let follower = await this.findOneUser(followerId);

        if (!follower) {
          // Créer un nouveau follower s'il n'existe pas
          const followerDto = new UserDto();
          followerDto.id = followerId;
          // Sauvegarder le nouveau follower dans la base de données
          await this.save(followerDto);
          return followerDto;
        } else {
          // Convertir en DTO
          const followerDto = new UserDto();
          Object.assign(followerDto, follower);
          return followerDto;
        }
      }));

      // Ajouter les followers à l'utilisateur
      await this.addFollowers(pseudo, followerDtos);
    } catch (error) {
      this.logger.error(`saveFollowers error for user ${pseudo}:`, error);
    }
  }

  async saveFollowings(pseudo: string, followings: string[]): Promise<void> {
    try {
      if (!followings || followings.length === 0) {
        return;
      }

      // Trouver l'utilisateur concerné
      const user = await this.findOneUser(pseudo);
      if (!user) {
        throw new Error(`User ${pseudo} not found`);
      }

      // Marquer comme traité
      await this.userRepository.update(pseudo, { hasFollowingProcess: true });

      // Créer les DTOs pour les followings
      const followingDtos = await Promise.all(followings.map(async (followingId) => {
        // Vérifier si le following existe déjà
        let following = await this.findOneUser(followingId);

        if (!following) {
          // Créer un nouveau following s'il n'existe pas
          const followingDto = new UserDto();
          followingDto.id = followingId;
          // Sauvegarder le nouveau following dans la base de données
          await this.save(followingDto);
          return followingDto;
        } else {
          // Convertir en DTO
          const followingDto = new UserDto();
          Object.assign(followingDto, following);
          return followingDto;
        }
      }));

      // Ajouter les followings à l'utilisateur
      await this.addFollowings(pseudo, followingDtos);
    } catch (error) {
      this.logger.error(`saveFollowings error for user ${pseudo}:`, error);
    }
  }

  async saveHobbies(pseudo: string, hobbies: string[]): Promise<void> {
    try {
      if (!hobbies || hobbies.length === 0) {
        return;
      }

      // Trouver l'utilisateur concerné
      const user = await this.findOneUser(pseudo);
      if (!user) {
        throw new Error(`User ${pseudo} not found`);
      }

      // Convertir les noms de hobbies en objets HobbyDto
      const hobbyDtos = hobbies.map(hobbyName => {
        const hobbyDto = new HobbyDto();
        hobbyDto.name = hobbyName;
        return hobbyDto;
      });

      // Ajouter les hobbies à l'utilisateur
      await this.addHobbies(pseudo, hobbyDtos);
    } catch (error) {
      this.logger.error(`saveHobbies error for user ${pseudo}:`, error);
    }
  }
}