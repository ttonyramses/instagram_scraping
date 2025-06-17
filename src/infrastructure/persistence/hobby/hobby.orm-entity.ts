import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { UserOrmEntity } from '../user/user.orm-entity';
import { HobbyKeywordsOrmEntity } from '../hobby_keywords/hobby_keywords.orm-entity';

@Entity({ name: 'hobby' })
export class HobbyOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { unique: true })
  name: string;

  @ManyToMany(() => UserOrmEntity, (user) => user.hobbies)
  users: UserOrmEntity[];

  @OneToMany(() => HobbyKeywordsOrmEntity, (hkwoe) => hkwoe.hobby)
  hobbyKeywords: HobbyKeywordsOrmEntity[];
}
