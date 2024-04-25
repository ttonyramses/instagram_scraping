import { chromium, Browser, BrowserContext,Page } from 'playwright';
import "reflect-metadata";

import cookies from './cookies.json' assert { type: 'json'};

import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

import { In } from "typeorm";


let users = [];
let users_pseupo = []
let users_pseupo_followings = []
let users_followings = []


async function autoScroll(page: Page) {


    await page.waitForLoadState('networkidle');
    // Utilisez page.locator pour cibler le bouton plus précisément
    const buttonLocator = page.locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(2) a.x1i10hfl'); // Remplacez 'button#monBouton' par le sélecteur correct

    // Vérifiez si le bouton est visible et cliquez dessus
    if (await buttonLocator.isVisible()) {
        await buttonLocator.click();
        console.info(`Clic effectué sur le bouton.`);
    } else {
        console.log(`Le bouton n'a pas été trouvé ou n'est pas visible sur la page.`);
    }


    // Créer un locator pour l'élément que vous souhaitez faire défiler dans la vue
    const elementLocator = page.locator('div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div:nth-child(5)').first();

    const all_element = page.locator('div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1)').first();

    let start_height = await all_element.evaluate(element => element.scrollHeight);

    console.info('Start Height =' + start_height);

    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause de 5 secondes


    // Positionnez la souris sur l'élément
    await elementLocator.hover();

    // Faire défiler la page vers le bas de 600 pixels
    for (let i = 0; i < 5; i++){

       await page.mouse.wheel(0, 600);

       await new Promise(resolve => setTimeout(resolve, 1000));

   }
    
    await page.waitForLoadState('networkidle');

    let usersShow = page.locator('div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div.x1dm5mii span._ap3a')

    let nbUsersShow = await usersShow.count()

    console.info('nombre element =' + nbUsersShow);

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

        await new Promise(resolve => setTimeout(resolve, 1000));

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

        await new Promise(resolve => setTimeout(resolve, 1000));

    }    
    }

    console.log('Nombre de followers récupérés' + users_pseupo.length);

    console.log('Dernier Followers' +users_pseupo[users_pseupo.length -1]);

    console.info('Scrolled to bottom of the specified element.');
}

async function autoScrollFollowings(page: Page) {

    await new Promise(resolve => setTimeout(resolve, 2000));

    
    await page.mouse.move(100, 100);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.mouse.click(100, 100);
    await new Promise(resolve => setTimeout(resolve, 1000));

    /*const retour = page.locator('div.x1qjc9v5')
     // Vérifiez si le bouton est visible et cliquez dessus
     if (await retour.isVisible()) {
        await retour.click();
        console.info(`Clic effectué sur le bouton.`);
    } else {
        console.log(`Le bouton n'a pas été trouvé ou n'est pas visible sur la page.`);
    }*/


    await page.waitForLoadState('networkidle');
    // Utilisez page.locator pour cibler le bouton plus précisément
    const buttonLocator = page.locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(3) a.x1i10hfl'); // Remplacez 'button#monBouton' par le sélecteur correct

    // Vérifiez si le bouton est visible et cliquez dessus
    if (await buttonLocator.isVisible()) {
        await buttonLocator.click();
        console.info(`Clic effectué sur le bouton.`);
    } else {
        console.log(`Le bouton n'a pas été trouvé ou n'est pas visible sur la page.`);
    }


    // Créer un locator pour l'élément que vous souhaitez faire défiler dans la vue
    const elementLocator = page.locator('div.x1qjc9v5 div._aano').first();

    const all_element = page.locator('div.x1qjc9v5 div._aano div:nth-child(1)').first();

    let start_height = await all_element.evaluate(element => element.scrollHeight);

    console.info('Start Height =' + start_height);

    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause de 5 secondes


    // Positionnez la souris sur l'élément
    await elementLocator.hover();

    // Faire défiler la page vers le bas de 600 pixels
    for (let i = 0; i < 5; i++){

       await page.mouse.wheel(0, 600);

       await new Promise(resolve => setTimeout(resolve, 1000));

   }
    
    await page.waitForLoadState('networkidle');

    let usersShow = page.locator('div.x1qjc9v5 div._aano div:nth-child(1) div.x1dm5mii span._ap3a')

    let nbUsersShow = await usersShow.count()

    console.info('nombre element =' + nbUsersShow);

    let last_get = 20
    for (let i = 0; i < last_get; i++) {
        const selector = page.locator(`div.x1qjc9v5 div._aano div:nth-child(1) div.x1dm5mii:nth-of-type(${i+1}) span._ap3a`).first()
        const text = await selector.textContent()
        users_pseupo_followings.push(text)
        console.log(i);
    }

    await elementLocator.hover();

    for (let i = 0; i < 6; i++){

        await page.mouse.wheel(0, 600);

        await new Promise(resolve => setTimeout(resolve, 1000));

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
            const selector = page.locator(`div.x1qjc9v5 div._aano div:nth-child(1) div.x1dm5mii:nth-of-type(${i+1}) span._ap3a`).first()
            const text = await selector.textContent()
            users_pseupo_followings.push(text)
            
        }

        console.log('Nombre de followers récupérés' + users_pseupo_followings.length);
            console.log('Nombre afficher' + nbUsersShow);

     // Faire défiler la page vers le bas de 600 pixels
     for (let i = 0; i < 3; i++){

        await page.mouse.wheel(0, 600);

        await new Promise(resolve => setTimeout(resolve, 1000));

    }    
    }

    console.log('Nombre de followers récupérés' + users_pseupo_followings.length);

    console.log('Dernier Followers' +users_pseupo_followings[users_pseupo_followings.length -1]);

    console.info('Scrolled to bottom of the specified element.');
}


export async function get_follow_user() {
    const browser = await chromium.launch({ headless: false }); // Mode non headless pour visualiser le défilement
    const context: BrowserContext = await browser.newContext();

    const pseudo = "jacoby_pio";

    // Autoriser les notifications
    await context.grantPermissions(['notifications'], { origin: 'https://www.instagram.com' });

    const page: Page = await context.newPage();

    await context.addCookies(cookies);
    
    await page.goto('https://www.instagram.com/' + pseudo + '/'); // Remplacez par l'URL désirée

    await autoScroll(page);

    await autoScrollFollowings(page)

    

    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        await createAndAddUsers(users_pseupo);
        await createAndAddUsers(users_pseupo_followings);
        await addFollowers(pseudo, users_pseupo);
        await addFollowings(pseudo, users_pseupo_followings)

    } catch (error) {
        console.error("Error during scraping or DB operation:", error);
    }

    await browser.close();




}

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


async function addFollowings(userId: string, followingIds: string[]) {
    const userRepository = AppDataSource.getRepository(User);
    
    // Charger l'utilisateur et ses followers existants
    const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["followings"]
    });

    if (user) {
        // Charger les nouveaux followers par leurs IDs
        const newFollowings = await userRepository.findBy({
            id: In(followingIds)
        });

        // Ajouter les nouveaux followers à la collection existante
        user.followings = [...user.followings, ...newFollowings];

        // Sauvegarder l'utilisateur mis à jour
        await userRepository.save(user);
        console.log("Followings added successfully");
    } else {
        console.log("User not found");
    }
}


//get_follow_user().catch(console.error);
