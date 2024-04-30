import { inject, injectable } from 'inversify';
import { IScrapingService } from '../interface/iscraping.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { IHobbyService } from '../../domaine/hobby/interface/ihobby.service';
import { HobbyDto } from '../../domaine/hobby/dto/hobby.dto';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { UserDto } from '../../domaine/user/dto/user.dto';

@injectable()
export class ScrapingService implements IScrapingService {
  private page: Page;
  private browser: Browser;
  private isBrowserInitialized: boolean = false;
  private baseUrl: string;

  constructor(
    @inject(TYPES.IUserService) private readonly userService: IUserService,
    @inject(TYPES.IHobbyService) private readonly hobbyService: IHobbyService,
  ) {
    this.baseUrl = process.env.BASE_SCRAPING_URL;
  }

  async applyHobbies(hobbies: string[], pseudos: string[]): Promise<void> {
    const hobbies_list = []
    for(const hobby of hobbies){
     const hob = await this.hobbyService.findOneHobbyByName(hobby);
      hobbies_list.push(hob)
    }
    const hobbiesDto = hobbies_list.map(hob => {
      const hobby = new HobbyDto();
      hobby.id = hob.id;
      hobby.name = hob.name;
      return hobby;
  });
    for(const pseudo of pseudos){
      const user = await this.userService.findOneUser(pseudo);
      if (!user) {
        console.log('user ' + pseudo + 'not found ');
      }
      else{
        await this.userService.addHobbies(pseudo, hobbiesDto)
        console.log('hobbies added to' + pseudo );
      }
    }
    
  }


  async getAllInfos( force: boolean, cookiesFileName: string, pseudoList?: string[]): Promise<void> {
    await this.initBrowser('/', cookiesFileName);
    if (pseudoList && pseudoList.length > 0) {
      for(const pseudo of pseudoList){
        const user = await this.userService.findOneUser(pseudo);
        console.log('user =', user);
        console.log('force =', force);
        if (!user) {
          console.log('user ' + pseudo + 'not found ');
        }
        if (user.hasInfo && !force) {
        console.log(
        'Les information de ' +
          pseudo +
          ' sont déjà présentes dans la base de données',
        );
      } else {
        const userDto = await this.getInfoUserOnPage(pseudo);
        await this.userService.save(userDto);
      }
    }
  }
    else{
      const users = force ? await this.userService.findAll() : await this.userService.findAllWithNoInfo();
      for(const user of users){
        const userDto = await this.getInfoUserOnPage(user.id);
        await this.userService.save(userDto);
      }
      
    }
    await this.closeBrowser();

  
    
  }


  async getAllFollow(
    force: boolean,
    cookiesFileName: string,
    hobbies?: string[],
    pseudoList?: string[]
  ): Promise<void> {
    await this.initBrowser('/', cookiesFileName);
    if (pseudoList && pseudoList.length > 0) {
      for(const pseudo of pseudoList){
        const user = await this.userService.findOneUser(pseudo);
        console.log('user =', user);
        console.log('force =', force);
        if (!user) {
          console.log('user ' + pseudo + 'not found ');
          return;
        }
        if (user.hasProcess && !force) {
        console.log(
          'Les followers de ' +
            user.id +
            ' sont déjà présentes dans la base de données',
          );
        return;
      } else {
        await this.getFollowersOfUser(pseudo);
        await this.getFollowingsOfUser(pseudo);
        user.hasProcess = true;
        await this.userService.save(user);
      }
    }
  }
    else{
      if(hobbies && hobbies.length > 0){
        const users =  await this.userService.findUsersWithSpecificHobbies(hobbies);

        for(const user of users){
          if (user.hasProcess && !force) {
          console.log(
          'Les followers de ' +
            user.id +
            ' sont déjà présentes dans la base de données',
          );
          return;
        } else {
          await this.getFollowersOfUser(user.id);
          await this.getFollowingsOfUser(user.id);
          user.hasProcess = true;
          await this.userService.save(user);
        }
      }

      }
      else{
        const users = await this.userService.findUsersWithAtLeastOneHobby();
        for(const user of users){
          if (user.hasProcess && !force) {
          console.log(
          'Les followers de ' +
            user.id +
            ' sont déjà présentes dans la base de données',
          );
          return;
        } else {
          await this.getFollowersOfUser(user.id);
          await this.getFollowingsOfUser(user.id);
          user.hasProcess = true;
          await this.userService.save(user);
        }
      }

      }
      
    }
    await this.closeBrowser();
  }

  private async initBrowser(suiteUrl: string, cookiesFileName?: string) {
    this.browser = await chromium.launch({ headless: false }); // Mode non headless pour visualiser le défilement
    const context: BrowserContext = await this.browser.newContext();

    // Autoriser les notifications
    const cookies = (
      await import(process.env.COOKIES_JSON_DIR + '/' + cookiesFileName)
    );

    console.log(cookies)
    await context.grantPermissions(['notifications'], {
      origin: this.baseUrl,
    });

    this.page = await context.newPage();

    await context.addCookies(cookies);

    const newUrl = this.baseUrl + (suiteUrl ? suiteUrl : '');
    console.log('newUrl = ', newUrl);
    await this.page.goto(newUrl); // Remplacez par l'URL désirée
  }

  private async closeBrowser() {
    await this.browser.close();
  }

  private async parseNumberFromString(input: string): Promise<number | null> {
    if (typeof input !== 'string') {
        throw new Error("Input must be a string");
    }

    // Déterminer si le dernier caractère est une lettre indiquant un multiplicateur
    const suffix = input.slice(-1);
    const isMultiplier = isNaN(parseInt(suffix));
    
    // Préparer la partie numérique de la chaîne en fonction de la présence d'un multiplicateur
    let numberPart = isMultiplier ? input.slice(0, -1) : input;
    numberPart = numberPart.replace(',', '.');

    // Convertir le segment numérique en flottant
    const value = parseFloat(numberPart);

    // Déterminer le multiplicateur basé sur le suffixe, si c'est un multiplicateur
    if (isMultiplier) {
        switch (suffix.toUpperCase()) {
            case 'K':
                return value * 1000;
            case 'M':
                return value * 1000000;
            case 'B':
                return value * 1000000000;
            default:
                // Si le suffixe n'est pas reconnu comme un multiplicateur valide
                return isNaN(value) ? null : value;
        }
    }

    // Si aucun suffixe n'est présent, retourner simplement la valeur numérique
    return isNaN(value) ? null : value;
}

  private async getInfoUserOnPage(pseudo: string): Promise<UserDto> {
    const user = new UserDto();
    const url = this.baseUrl + '/' + pseudo
    await this.page.goto(url);
    await this.sleep(1_000);
    user.id = await this.page
      .locator('main.xvbhtw8 header.x1qjc9v5 section div.x9f619')
      .first()
      .textContent();

    user.nbFollowers = await this.parseNumberFromString(
      await this.page
        .locator(
          'main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(2) span._ac2a',
        )
        .first()
        .textContent(),
    );

    user.nbFollowing = await this.parseNumberFromString(
      await this.page
        .locator(
          'main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(3) span._ac2a',
        )
        .first()
        .textContent(),
    );

    user.name = await this.page
      .locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z span.x1lliihq')
      .first()
      .textContent();

    user.biography = await this.page
      .locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z h1')
      .first()
      .textContent();

    user.hasInfo = true;

    return user;
  }

  private async scroll(){
    for (let i = 0; i < 3; i++){

      await this.page.mouse.wheel(0, 600);

      await new Promise(resolve => setTimeout(resolve, 1000));

  }
}

  private async addFollowers(pseudo, userIds){

    const users = userIds.map(id => {
      const user = new UserDto();
      user.id = id;
      return user;
  });

  await this.userService.saveAll(users);
  await this.userService.addFollowers(pseudo, users)


  }

  private async addFollowings(pseudo, userIds){

    const users = userIds.map(id => {
      const user = new UserDto();
      user.id = id;
      return user;
  });

  await this.userService.saveAll(users);
  await this.userService.addFollowings(pseudo, users)


  }
 

  private async getFollowersOfUser(pseudo: string) {

    const url = this.baseUrl + '/' + pseudo
    await this.page.goto(url);
    await this.sleep(1_000);
    await this.page.waitForLoadState('networkidle');
    // Utilisez page.locator pour cibler le bouton plus précisément
    const buttonLocator = this.page.locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(2) a.x1i10hfl'); // Remplacez 'button#monBouton' par le sélecteur correct

    // Vérifiez si le bouton est visible et cliquez dessus
    if (await buttonLocator.isVisible()) {
        await buttonLocator.click();
        console.info(`Clic effectué sur le bouton.`);
    } else {
        console.log(`Le bouton n'a pas été trouvé ou n'est pas visible sur la page.`);
    }


    // Créer un locator pour l'élément que vous souhaitez faire défiler dans la vue
    const elementLocator = this.page.locator('div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div:nth-child(5)').first();

    const all_element = this.page.locator('div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1)').first();


    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause de 5 secondes


    // Positionnez la souris sur l'élément
    await elementLocator.hover();

    // Faire défiler la page vers le bas de 600 pixels
    await this.scroll();

    await this.sleep(5_000);
    
    //await this.page.waitForLoadState('networkidle');

    let usersShow = await this.page.locator('div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div.x1dm5mii span._ap3a')

    let nbUsersShow = await usersShow.count()

    let nbGet = 0

    console.info('nombre element =' + nbUsersShow);

    const usersNames = []

    await this.scroll();
    await this.scroll();

    let last_get = 10
    for (let i = 0; i < last_get; i++) {
        const selector = this.page.locator(`div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div.x1dm5mii:nth-of-type(${i+1}) span._ap3a`).first()
        const text = await selector.textContent()
        usersNames.push(text)
    }

    await this.addFollowers(pseudo, usersNames)

    nbGet += usersNames.length;


    await elementLocator.hover();

    await this.scroll();
    await this.scroll();
    await this.scroll();

    await this.sleep(5_000);
     
    await this.page.waitForLoadState('networkidle');


    nbUsersShow = await usersShow.count()
     



    while (last_get < nbUsersShow) {

        const final = last_get
        const usersNames = []

        nbUsersShow = await usersShow.count()

        if((nbUsersShow-last_get)>15){
            last_get += 15
        }
        else{
            last_get = last_get + (nbUsersShow-last_get)
        }

        for (let i = final; i < last_get; i++) {
            const selector = this.page.locator(`div.x1ja2u2z div.x7r02ix div div._aano div:nth-child(1) div.x1dm5mii:nth-of-type(${i+1}) span._ap3a`).first()
            const text = await selector.textContent()
            usersNames.push(text)
            
        }

        await this.addFollowers(pseudo, usersNames)

        nbGet += usersNames.length;

        console.log('Nombre de followers récupérés' + nbGet);
            console.log('Nombre afficher' + nbUsersShow);

     // Faire défiler la page vers le bas de 600 pixels

     nbUsersShow = await usersShow.count()
     console.log('Nombre afficher' + nbUsersShow);
     await this.scroll(); 
     await this.sleep(5_000);   
    }

    console.log('Nombre de followers récupérés' + nbGet);

    //console.log('Dernier Followers' +users_pseupo[users_pseupo.length -1]);

    console.info('Scrolled to bottom of the specified element.');
}

private async getFollowingsOfUser(pseudo: string) {

  await new Promise(resolve => setTimeout(resolve, 2000));

    
  await this.page.mouse.move(100, 100);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await this.page.mouse.click(100, 100);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await this.sleep(1_000);
  await this.page.waitForLoadState('networkidle');
  // Utilisez page.locator pour cibler le bouton plus précisément
  const buttonLocator = this.page.locator('main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(3) a.x1i10hfl'); // Remplacez 'button#monBouton' par le sélecteur correct

  // Vérifiez si le bouton est visible et cliquez dessus
  if (await buttonLocator.isVisible()) {
      await buttonLocator.click();
      console.info(`Clic effectué sur le bouton.`);
  } else {
      console.log(`Le bouton n'a pas été trouvé ou n'est pas visible sur la page.`);
  }


  // Créer un locator pour l'élément que vous souhaitez faire défiler dans la vue
  const elementLocator = this.page.locator('div.x1qjc9v5 div._aano').first();

  const all_element = this.page.locator('div.x1qjc9v5 div._aano div:nth-child(1)').first();


  await new Promise(resolve => setTimeout(resolve, 1000)); // Pause de 5 secondes


  // Positionnez la souris sur l'élément
  await elementLocator.hover();

  // Faire défiler la page vers le bas de 600 pixels
  await this.scroll();

  await this.sleep(5_000);
  
  //await this.page.waitForLoadState('networkidle');

  let usersShow = await this.page.locator('div.x1qjc9v5 div._aano div:nth-child(1) div.x1dm5mii span._ap3a')

  let nbUsersShow = await usersShow.count()

  let nbGet = 0

  console.info('nombre element =' + nbUsersShow);

  const usersNames = []

  await this.scroll();
  await this.scroll();

  let last_get = 10
  for (let i = 0; i < last_get; i++) {
      const selector = this.page.locator(`div.x1qjc9v5 div._aano div:nth-child(1) div.x1dm5mii:nth-of-type(${i+1}) span._ap3a`).first()
      const text = await selector.textContent()
      usersNames.push(text)
  }

  await this.addFollowings(pseudo, usersNames)

  nbGet += usersNames.length;


  await elementLocator.hover();

  await this.scroll();
  await this.scroll();
  await this.scroll();

  await this.sleep(5_000);
   
  await this.page.waitForLoadState('networkidle');


  nbUsersShow = await usersShow.count()
   



  while (last_get < nbUsersShow) {

      const final = last_get
      const usersNames = []

      nbUsersShow = await usersShow.count()

      if((nbUsersShow-last_get)>15){
          last_get += 15
      }
      else{
          last_get = last_get + (nbUsersShow-last_get)
      }

      for (let i = final; i < last_get; i++) {
          const selector = this.page.locator(`div.x1qjc9v5 div._aano div:nth-child(1) div.x1dm5mii:nth-of-type(${i+1}) span._ap3a`).first()
          const text = await selector.textContent()
          usersNames.push(text)
          
      }

      await this.addFollowings(pseudo, usersNames)

      nbGet += usersNames.length;

      console.log('Nombre de followers récupérés' + nbGet);
          console.log('Nombre afficher' + nbUsersShow);

   // Faire défiler la page vers le bas de 600 pixels

   nbUsersShow = await usersShow.count()
   console.log('Nombre afficher' + nbUsersShow);
   await this.scroll(); 
   await this.sleep(5_000);   
  }

  console.log('Nombre de followings récupérés' + nbGet);

  //console.log('Dernier Followers' +users_pseupo[users_pseupo.length -1]);

  console.info('Scrolled to bottom of the specified element.');
}


  private async sleep(time: number): Promise<void> {
    await setTimeout(() => {}, time);
  }
}
