//import "reflect-metadata";
import { Entity, Column, PrimaryColumn, ManyToMany, JoinTable, } from "typeorm"
import { Hobby } from "./Hobby"

@Entity({ name: 'insta_user' })
export class User {

    @PrimaryColumn("text")
    id: string

    @Column("text")
    name: string

    @Column("text", { nullable: true })
    biography: string | null 

    @Column("double", { nullable: true })
    nbOfFollowers: number | null

    @Column("double", { nullable: true })
    nbOffollowing: number | null

    @ManyToMany((type) => User, (user) => user.followers, {
        //cascade: ['insert', 'update'],
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

