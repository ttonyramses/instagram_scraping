//import "reflect-metadata";
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, } from "typeorm";

import { User } from "./User";

@Entity({ name: 'hobbies' })
export class Hobby {

    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar")
    name: string

    @ManyToMany((type) => User, (user) => user.hobbies)
      users: User[];

  
}