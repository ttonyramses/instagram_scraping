import { PlaywrightCrawler, PlaywrightCrawlingContext, Dataset, sleep } from 'crawlee';

import cookies from './cookies.json' assert { type: 'json'};

import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

let isCrawlerRunning = false;
let users = [];

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
    await page.waitForNavigation();

    // Attendre que le popup soit visible
    const popupLocator = page.locator('div.x1ja2u2z div.x7r02ix div div._aano div').first();  // Remplacez 'div#popupId' par le locator correct du popup
    await popupLocator.waitFor();

    await popupLocator.scrollIntoViewIfNeeded()


    // Exemple d'extraction des données des balises h1
   // const data = await page.$$eval('h1', (headers) => headers.map(h => h.textContent));
   await sleep(30_000);
    /*const pseudo = await page.locator('main.xvbhtw8 header.x1qjc9v5 section div.x9f619').first().textContent();
    
    const nbOfFollowers = await page.locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(2) span._ac2a').first().textContent();

    const nbOffollowing = await page.locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(3) span._ac2a').first().textContent();

    const name = await page.locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z span.x1lliihq').first().textContent();

    const biography = await page.locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z h1').first().textContent();*/

    
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

crawler.addRequests(['https://www.instagram.com/luc_mndn/']);
// Lancement du crawler

crawler.run()
.then(() => console.log('Crawling completed!'))
.catch((error) => console.error(`Crawling failed: ${error}`));
