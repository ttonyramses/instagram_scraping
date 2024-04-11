import cookies from './cookies.json' assert { type: 'json'};
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, sleep, ProxyConfiguration } from 'crawlee';

import { router } from './routes.js';
import { Hobby } from './entity/Hobby';

const startUrls = ['https://www.instagram.com'];

const crawler = new PlaywrightCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    preNavigationHooks: [
        async (crawlingContext, gotoOptions) => {
            const { page } = crawlingContext;
            
          const context =  crawlingContext.page.context();
          context.addCookies(cookies);
          context.grantPermissions(['notifications'], {origin: 'https://www.instagram.com'})
            
        },
    ],
    
    //requestHandler: router,

    headless: false,
    // Comment this option to scrape the full website.
    maxRequestsPerCrawl: 20,
});

AppDataSource.initialize().then(async () => {

    console.log("Inserting a new hobby into the database...")
    const hobby = new Hobby()
    hobby.name = "Musique"
    await AppDataSource.manager.save(hobby)
    console.log("Saved a new user with id: " + hobby.id)

    console.log("Inserting a new user into the database...")
    const user1 = new User()
    user1.name = "Timber"
    user1.id = "Sawe"
    await AppDataSource.manager.save(user1)
    console.log("Saved a new user with id: " + user1.id)

    console.log("Inserting a new user into the database...")
    const user2 = new User()
    user2.name = "Timberlake"
    user2.id = "Sawe2"
    user2.followers = [user1]
    user2.hobby = [hobby]
    await AppDataSource.manager.save(user2)
    console.log("Saved a new user with id: " + user2.id)


    console.log("Loading users from the database...")
    const users = await AppDataSource.manager.find(User)
    console.log("Loaded users: ", users)

    console.log("Loading hobbys from the database...")
    const hobbys = await AppDataSource.manager.find(Hobby)
    console.log("Loaded Hobbys: ", hobbys)

    /*console.log("Loading users from the database...")
    const followers = await AppDataSource.manager.find(User)
    console.log("Loaded users: ", users)*/



    console.log("Here you can setup and run express / fastify / any other framework.")

}).catch(error => console.log(error))

//await crawler.run(startUrls);
