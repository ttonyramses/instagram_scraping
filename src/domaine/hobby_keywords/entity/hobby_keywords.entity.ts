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


@Entity({ name: 'hobby_keywords' })
@Unique(['hobby_id', 'keyword'])
export class hobby_keywords {

  
  @ManyToOne(() => Hobby)
  hobby_id: Hobby;

  @Column('text', { nullable: true })
  keyword: string | null 

}
