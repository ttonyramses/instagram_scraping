//import "reflect-metadata";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { HobbyKeywords } from '../../hobby_keywords/entity/hobby_keywords.entity';


@Entity({ name: 'hobby' })
export class Hobby {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', {unique: true})
  name: string;

  @ManyToMany((type) => User, (user) => user.hobbies)
  users: User[];

  @OneToMany(() => HobbyKeywords, hkw => hkw.hobby)
  hobbyKeywords: HobbyKeywords[];
}
