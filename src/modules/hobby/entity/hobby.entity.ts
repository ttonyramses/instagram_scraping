//import "reflect-metadata";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';


@Entity({ name: 'hobby' })
export class Hobby {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  name: string;

  @ManyToMany((type) => User, (user) => user.hobbies)
  users: User[];
}
