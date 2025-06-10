import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/user/entities/user.entity';
import { UserRepository } from '../../../domain/user/ports/user.repository.interface';
import { UserOrmEntity } from './user.orm-entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userOrmRepository: Repository<UserOrmEntity>,
    private readonly userMapper: UserMapper,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({ 
      where: { id } 
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  async findWithRelations(id: string, relations: string[] = []): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { id },
      relations
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  async findByInstagramId(instagramId: number): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({ 
      where: { instagramId } 
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  async findByFacebookId(facebookId: number): Promise<User | null> {
    const userOrm = await this.userOrmRepository.findOne({ 
      where: { facebookId } 
    });
    return userOrm ? this.userMapper.toDomain(userOrm) : null;
  }

  async findAll(): Promise<User[]> {
    const usersOrm = await this.userOrmRepository.find();
    return usersOrm.map(userOrm => this.userMapper.toDomain(userOrm));
  }

  async save(user: User): Promise<User> {
    const userOrm = this.userMapper.toOrm(user);
    const savedUserOrm = await this.userOrmRepository.save(userOrm);
    return this.userMapper.toDomain(savedUserOrm as UserOrmEntity);
  }

  async delete(id: string): Promise<void> {
    await this.userOrmRepository.delete({ id });
  }

  async findByCategory(category: string): Promise<User[]> {
    const usersOrm = await this.userOrmRepository.find({ 
      where: { category } 
    });
    return usersOrm.map(userOrm => this.userMapper.toDomain(userOrm));
  }

  async findActiveUsers(): Promise<User[]> {
    const usersOrm = await this.userOrmRepository.find({ 
      where: { enable: true } 
    });
    return usersOrm.map(userOrm => this.userMapper.toDomain(userOrm));
  }
}
