//import 'reflect-metadata';
import { Entity, Column, PrimaryColumn, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Hobby } from '../../hobby/entity/hobby.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar', { nullable: true })
  name: string | null;

  @Column('text', { nullable: true })
  biography: string | null;

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
  hasProcess: boolean;

  @Column('boolean', { default: true })
  enable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany((type) => User, (user) => user.followers, {
    cascade: ['insert', 'update'],
    //cascade: true,
  })
  @JoinTable({
    name: 'user_followers', // table name for the junction table of this relation
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'follower_id',
      referencedColumnName: 'id',
    },
  })
  followers: User[];

  @ManyToMany((type) => User, (user) => user.followings, {
    //cascade: ['insert', 'update'],
    //cascade: true,
  })
  @JoinTable({
    name: 'user_followings', // table name for the junction table of this relation
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'following_id',
      referencedColumnName: 'id',
    },
  })
  followings: User[];

  @ManyToMany((type) => Hobby, (hobby) => hobby.users, {
    //cascade: ['insert', 'update'],
    //cascade: true,
  })
  @JoinTable({
    name: 'user_hobby', // table name for the junction table of this relation
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'hobby_id',
      referencedColumnName: 'id',
    },
  })
  hobbies: Hobby[];
}
