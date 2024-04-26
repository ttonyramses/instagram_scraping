import cookies from './cookies.json' assert { type: 'json'};
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

import { scrape_users } from './scrawl_many_users';
import { get_follow_user } from './getFollowersOfOneUser';

export async function get_profil_data(user_arg: string[] = []){

    if(user_arg.length >0){
        await scrape_users(user_arg)
    }
    else{
        await scrape_users()
    }
}

export async function get_follow(user_arg? : string){
    await get_follow_user()
}



