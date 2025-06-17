//import "reflect-metadata";
import { Entity, ManyToOne, PrimaryColumn, JoinColumn, Column } from 'typeorm';
import { HobbyOrmEntity } from '../hobby/hobby.orm-entity';

@Entity({ name: 'hobby_keywords' })
export class HobbyKeywordsOrmEntity {
  @ManyToOne(
    () => HobbyOrmEntity,
    (hobbyOrmEntity) => hobbyOrmEntity.hobbyKeywords,
  )
  @JoinColumn({ name: 'hobby_id' })
  @PrimaryColumn({ name: 'hobby_id', type: 'int' })
  hobby: HobbyOrmEntity;

  @PrimaryColumn('varchar')
  keyword: string;

  @Column('int', { default: 0 })
  score: number;
}
