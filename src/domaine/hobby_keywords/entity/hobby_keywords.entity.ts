//import "reflect-metadata";
import {
  Entity,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  Column,
} from 'typeorm';
import { Hobby } from '../../hobby/entity/hobby.entity';


@Entity({ name: 'hobby_keywords' })
export class HobbyKeywords {

  @ManyToOne(() => Hobby, hobby => hobby.hobbyKeywords)
  @JoinColumn({ name: 'hobby_id' })
  @PrimaryColumn({ name: 'hobby_id', type: 'int' })
  hobby: Hobby;

  @PrimaryColumn('varchar')
  keyword: string 
  
  @Column('int', { default: 0 })
  score: number
}
