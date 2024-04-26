import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Hobby } from "./entity/Hobby"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: true,
    logging: false,
    entities: [User, Hobby],
    migrations: [],
    subscribers: [],
})
