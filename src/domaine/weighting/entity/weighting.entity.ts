//import "reflect-metadata";
import {
  Entity,
  Column,
  ManyToOne,
  Unique,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Hobby } from '../../hobby/entity/hobby.entity';


@Entity({ name: 'weighting' })
//@Unique(['user', 'hobby'])
export class weighting {

  @PrimaryColumn({ type: 'int', name: 'hobbyId' })
  @ManyToOne(() => Hobby)
  hobby: Hobby;

  @PrimaryColumn({ type: 'varchar', name: 'userId' })
  @ManyToOne(() => User)
  user: User;

  @Column('bigint', { nullable: true })
  score: number | null;

  @Column('int', { nullable: true })
  occurrences: number | null;

  @Column('int', { nullable: true })
  following_occurrences: number | null;

  @Column('int', { nullable: true })
  hobby_in_bio: number | null;
}
