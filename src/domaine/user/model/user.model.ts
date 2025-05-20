import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  biography: string;

  @Column({ nullable: true })
  nbFollowers: number;

  @Column({ nullable: true })
  nbFollowings: number;

  @Column({ nullable: true })
  nbPublications: number;

  @Column({ nullable: true })
  instagramId: number;

  @Column({ nullable: true })
  facebookId: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true })
  profileUrl: string;

  @Column({ default: false })
  hasInfo: boolean;

  @Column({ default: true })
  enable: boolean;

  @Column({ type: 'json', nullable: true })
  json: any;

  @Column({ default: false })
  hasFollowers: boolean;

  @Column({ default: false })
  hasFollowings: boolean;

  @Column({ default: false })
  hasHobbies: boolean;

  @Column({ type: 'simple-array', nullable: true })
  followers: string[];

  @Column({ type: 'simple-array', nullable: true })
  followings: string[];

  @Column({ type: 'simple-array', nullable: true })
  hobbies: string[];
} 