//import "reflect-metadata";
import {
  Entity,
  Column,
  ManyToOne,
  Unique,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Hobby } from '../../hobby/entity/hobby.entity';


@Entity({ name: 'weighting' })
@Unique(['user', 'hobby'])
export class weighting {

  @PrimaryGeneratedColumn()
  id : number;
  
  @ManyToOne(() => Hobby)
  hobby: Hobby;

  
  @ManyToOne(() => User)
  user: User;

  @Column('int', { nullable: true })
  score: number | null;

  @Column('int', { nullable: true })
  occurrences: number | null;

  @Column('int', { nullable: true })
  hobby_in_bio: number | null;
}
