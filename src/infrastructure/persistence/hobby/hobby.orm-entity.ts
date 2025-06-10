import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { UserOrmEntity } from '../user/user.orm-entity';

@Entity({ name: 'hobby' })
export class HobbyOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { unique: true })
  name: string;

  @ManyToMany(() => UserOrmEntity, user => user.hobbies)
  users: UserOrmEntity[];
}
