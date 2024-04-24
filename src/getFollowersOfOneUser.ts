import { PlaywrightCrawler, PlaywrightCrawlingContext, Dataset, sleep } from 'crawlee';

import "reflect-metadata";

import cookies from './cookies.json' assert { type: 'json'};

import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

import { In } from "typeorm";

let isCrawlerRunning = false;
let users = [];
let users_pseupo = []



// Fonction pour gérer chaque page visitée
async function pageFunction(context: PlaywrightCrawlingContext) {
    const { page, request, log, enqueueLinks  } = context;

    log.info(`Processing ${request.url}...`);
    // Assurez-vous que la page est chargée
    await page.waitForLoadState('networkidle');

    // Utilisez page.locator pour cibler le bouton plus précisément
    const buttonLocator = page.locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(2) a.x1i10hfl'); // Remplacez 'button#monBouton' par le sélecteur correct

    // Vérifiez si le bouton est visible et cliquez dessus
    if (await buttonLocator.isVisible()) {
        await buttonLocator.click();
        log.info(`Clic effectué sur le bouton.`);
    } else {
        console.log(`Le bouton n'a pas été trouvé ou n'est pas visible sur la page.`);
    }

    

    // Optionnel : attendre une navigation ou un changement d'état après le clic
    //await page.waitForNavigation();

     // Créer un locator pour l'élément que vous souhaitez faire défiler dans la vue
     const elementLocator = page.locator('div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div:nth-child(5)').first();

     const all_element = page.locator('div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1)').first();

     let start_height = await all_element.evaluate(element => element.scrollHeight);

     log.info('Start Height =' + start_height);

     await sleep(3_000);


     await sleep(3_000);







     

     // Positionnez la souris sur l'élément
     await elementLocator.hover();

     // Faire défiler la page vers le bas de 600 pixels
     for (let i = 0; i < 5; i++){

        await page.mouse.wheel(0, 600);

     await sleep(1_000);

    }
     
     await page.waitForLoadState('networkidle');

     let usersShow = page.locator('div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div.x1dm5mii span._ap3a')

     let nbUsersShow = await usersShow.count()

     log.info('nombre element =' + nbUsersShow);

     let last_get = 20

     for (let i = 0; i < last_get; i++) {
        const selector = page.locator(`div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div.x1dm5mii:nth-of-type(${i+1}) span._ap3a`).first()
        const text = await selector.textContent()
        users_pseupo.push(text)
        console.log(i);
    }

    await elementLocator.hover();

    for (let i = 0; i < 6; i++){

        await page.mouse.wheel(0, 600);

     await sleep(3_000);

    }
     
     await page.waitForLoadState('networkidle');


     nbUsersShow = await usersShow.count()
     

     /*let end_height = await all_element.evaluate(element => element.scrollHeight);

     log.info('End Height =' + end_height);*/

     while (last_get < nbUsersShow) {

        const final = last_get

        nbUsersShow = await usersShow.count()

        if((nbUsersShow-last_get)>15){
            last_get += 15
        }
        else{
            last_get = last_get + (nbUsersShow-last_get)
        }

        for (let i = final; i < last_get; i++) {
            const selector = page.locator(`div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div.x1dm5mii:nth-of-type(${i+1}) span._ap3a`).first()
            const text = await selector.textContent()
            users_pseupo.push(text)
            
        }

        console.log('Nombre de followers récupérés' + users_pseupo.length);
            console.log('Nombre afficher' + nbUsersShow);



        

     // Faire défiler la page vers le bas de 600 pixels
     for (let i = 0; i < 3; i++){

        await page.mouse.wheel(0, 600);

     await sleep(1_000);

    }


        
        
    }

    console.log('Nombre de followers récupérés' + users_pseupo.length);

    console.log('Dernier Followers' +users_pseupo[users_pseupo.length -1]);






    log.info('Scrolled to bottom of the specified element.');


    
}


// Configuration du crawler Playwright
const crawler = new PlaywrightCrawler({

    preNavigationHooks: [
        async (crawlingContext, gotoOptions) => {
            const { page } = crawlingContext;
            
          //const context =  crawlingContext.page.context();
          const context = page.context();
          context.addCookies(cookies);
          context.grantPermissions(['notifications'], {origin: 'https://www.instagram.com'});
          gotoOptions.timeout = 600000;
            
        },
    ],

    maxRequestRetries: 0,

    // Fonction à exécuter pour chaque page ouverte
    requestHandler: pageFunction,  // Utiliser une fonction référence ici
    requestHandlerTimeoutSecs: 360000,  // Timeout du gestionnaire de requête de 1 heure

    headless: false,
    // Configuration de la tête de lecture
    /*browserPoolOptions: {
        useIncognitoPages: true, // Utilisez des pages en incognito pour éviter le partage de l'état du navigateur
    },*/
});

// Ajout de l'URL de départ
//crawler.addRequests(['https://www.instagram.com/luc_mndn/']);

/*export async function scrape(urls): Promise<User[]>
{
//const url_pseudo = 'https://www.instagram.com/' + pseudo +'/'
// Ajout de l'URL de départ

crawler.addRequests(urls);
// Lancement du crawler

await crawler.run()
.then(() => console.log('Crawling completed!'))
.catch((error) => console.error(`Crawling failed: ${error}`));
return users;

}*/

// Ajout de l'URL de départ
export async function scrape() {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        crawler.addRequests(['https://www.instagram.com/jeanclaude.mendes/']);
        await crawler.run();
        console.log('Crawling completed!');

        await createAndAddUsers(users_pseupo);
        await addFollowers("jeanclaude.mendes", users_pseupo);

    } catch (error) {
        console.error("Error during scraping or DB operation:", error);
    }
}


scrape();


async function createAndAddUsers(userIds: string[]) {
    const userRepository = AppDataSource.getRepository(User);

    // Créer des objets utilisateur à partir des IDs
    const users = userIds.map(id => {
        const user = new User();
        user.id = id;
        return user;
    });

    // Sauvegarder tous les utilisateurs en utilisant une insertion en masse
    await userRepository.save(users);
    console.log("All users have been saved.");
}


async function addFollowers(userId: string, followerIds: string[]) {
    const userRepository = AppDataSource.getRepository(User);
    
    // Charger l'utilisateur et ses followers existants
    const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["followers"]
    });

    if (user) {
        // Charger les nouveaux followers par leurs IDs
        const newFollowers = await userRepository.findBy({
            id: In(followerIds)
        });

        // Ajouter les nouveaux followers à la collection existante
        user.followers = [...user.followers, ...newFollowers];

        // Sauvegarder l'utilisateur mis à jour
        await userRepository.save(user);
        console.log("Followers added successfully");
    } else {
        console.log("User not found");
    }
}





