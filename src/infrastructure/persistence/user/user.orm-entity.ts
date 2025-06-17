import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HobbyOrmEntity } from '../hobby/hobby.orm-entity';
@Entity({ name: 'user' })
export class UserOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar', { nullable: true })
  name: string | null;

  @Column('text', { nullable: true })
  biography: string | null;

  @Column('jsonb', { nullable: true })
  json: object | null;

  @Column('int', { nullable: true })
  nbFollowers: number | null;

  @Column('int', { nullable: true })
  nbFollowings: number | null;

  @Column('int', { nullable: true })
  nbPublications: number | null;

  @Column('bigint', { nullable: true })
  instagramId: number | null;

  @Column('bigint', { nullable: true })
  facebookId: number | null;

  @Column('varchar', { nullable: true })
  category: string | null;

  @Column('varchar', { nullable: true })
  externalUrl: string | null;

  @Column('varchar', { nullable: true })
  profileUrl: string | null;

  @Column('boolean', { default: false })
  hasInfo: boolean;

  @Column('boolean', { default: false })
  hasFollowerProcess: boolean;

  @Column('boolean', { default: false })
  hasFollowingProcess: boolean;

  @Column('boolean', { default: true })
  enable: boolean;

  @Column('varchar', { nullable: true })
  maxIdFollower: string | null;

  @Column('varchar', { nullable: true })
  maxIdFollowing: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => UserOrmEntity, (user) => user.followers, {
    cascade: ['insert', 'update'],
  })
  @JoinTable({
    name: 'user_followers',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'follower_id', referencedColumnName: 'id' },
  })
  followers: UserOrmEntity[];

  @ManyToMany(() => UserOrmEntity, (user) => user.followings)
  @JoinTable({
    name: 'user_followings',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'following_id', referencedColumnName: 'id' },
  })
  followings: UserOrmEntity[];

  @ManyToMany(() => HobbyOrmEntity, (hobby) => hobby.users)
  @JoinTable({
    name: 'user_hobby',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hobby_id', referencedColumnName: 'id' },
  })
  hobbies: HobbyOrmEntity[];
}
