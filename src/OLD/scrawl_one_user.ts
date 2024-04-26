import { PlaywrightCrawler, PlaywrightCrawlingContext, Dataset, sleep } from 'crawlee';

import cookies from './cookies.json' assert { type: 'json'};

import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

let isCrawlerRunning = false;
let users = [];

function parseNumberFromString(input) {
    if (typeof input !== 'string') {
        return null;  // ou throw new Error("Input must be a string");
    }

    // Obtenez le dernier caractère pour déterminer le multiplicateur
    const suffix = input.slice(-1).toUpperCase();
    const value = parseFloat(input.slice(0, -1));

    // Déterminez le multiplicateur en fonction du suffixe
    switch (suffix) {
        case 'K':
            return value * 1000;
        case 'M':
            return value * 1000000;
        case 'B':
            return value * 1000000000;
        default:
            // Pas de suffixe détecté, retourne le nombre parse directement
            return parseFloat(input);
    }
}

// Fonction pour gérer chaque page visitée
async function pageFunction(context: PlaywrightCrawlingContext) {
    const { page, request, log, enqueueLinks  } = context;

    log.info(`Processing ${request.url}...`);

    // Exemple d'extraction des données des balises h1
   // const data = await page.$$eval('h1', (headers) => headers.map(h => h.textContent));
   await sleep(30_000);
    const pseudo = await page.locator('main.xvbhtw8 header.x1qjc9v5 section div.x9f619').first().textContent();
    
    const nbOfFollowers = await page.locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(2) span._ac2a').first().textContent();

    const nbOffollowing = await page.locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(3) span._ac2a').first().textContent();

    const name = await page.locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z span.x1lliihq').first().textContent();

    const biography = await page.locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z h1').first().textContent();

    // Enregistrement des données extraites
    await Dataset.pushData({
        url: request.url,
        id: pseudo,
        name: name,
        nbOfFollowers: parseNumberFromString(nbOfFollowers),
        nbOffollowing: parseNumberFromString(nbOffollowing),
        biography: biography
    });

    const user = new User()
    user.id = pseudo
    user.name = name
    user.nbOfFollowers = parseNumberFromString(nbOfFollowers)
    user.nbOffollowing = parseNumberFromString(nbOffollowing)
    user.biography = biography

    users.push(user)




    
}


// Configuration du crawler Playwright
const crawler = new PlaywrightCrawler({

    preNavigationHooks: [
        async (crawlingContext, gotoOptions) => {
            const { page } = crawlingContext;
            
          const context =  crawlingContext.page.context();
          context.addCookies(cookies);
          context.grantPermissions(['notifications'], {origin: 'https://www.instagram.com'})
            
        },
    ],
    // Fonction à exécuter pour chaque page ouverte
    requestHandler: pageFunction,
    
    headless: false,
    // Configuration de la tête de lecture
    /*browserPoolOptions: {
        useIncognitoPages: true, // Utilisez des pages en incognito pour éviter le partage de l'état du navigateur
    },*/
});

// Ajout de l'URL de départ
//crawler.addRequests(['https://www.instagram.com/luc_mndn/']);

export async function scrape(urls): Promise<User[]>
{
//const url_pseudo = 'https://www.instagram.com/' + pseudo +'/'
// Ajout de l'URL de départ

crawler.addRequests(urls);
// Lancement du crawler

await crawler.run()
.then(() => console.log('Crawling completed!'))
.catch((error) => console.error(`Crawling failed: ${error}`));
return users;

}
