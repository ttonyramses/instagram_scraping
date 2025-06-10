import { User } from '../entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByInstagramId(instagramId: number): Promise<User | null>;
  findByFacebookId(facebookId: number): Promise<User | null>;
  findAll(): Promise<User[]>;
  findWithRelations(id: string, relations?: string[]): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findByCategory(category: string): Promise<User[]>;
  findActiveUsers(): Promise<User[]>;
}
