import { scrape } from './scrawl_one_user';
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

export async function scrape_users(user_arg? : string){
AppDataSource.initialize().then(async () => {

    let urls_pseudo = []

    if(user_arg){
        console.log(user_arg);
        const url_pseudo = 'https://www.instagram.com/' + user_arg +'/'
        urls_pseudo.push(url_pseudo)
    }
    else{
    console.log("Loading users from the database...")
    const users = await AppDataSource.manager.find(User)

    for (const user of users) {

        console.log(user);
        const url_pseudo = 'https://www.instagram.com/' + user.id +'/'
        urls_pseudo.push(url_pseudo)

    }

}

    const users2 = await scrape(urls_pseudo)
    for (const user2 of users2) {

        const user = await AppDataSource.manager.findOneBy(User, { id: user2.id });

        if (user) {
            user.name = user2.name;
            user.nbOfFollowers = user2.nbOfFollowers;
            user.nbOffollowing = user2.nbOffollowing;
            user.biography = user2.biography;
            await AppDataSource.manager.save(user);
            console.log("User has been updated");
        } else {
            console.log("User not found");
        }

    }





    //console.log("Loaded users: ", users[1])


    console.log("Here you can setup and run express / fastify / any other framework.")

}).catch(error => console.log(error))


}




//scrape('luc_mndn');
