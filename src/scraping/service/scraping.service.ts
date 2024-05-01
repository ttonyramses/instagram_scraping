import { inject, injectable } from 'inversify';
import { IScrapingService } from '../interface/iscraping.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { IHobbyService } from '../../domaine/hobby/interface/ihobby.service';
import { HobbyDto } from '../../domaine/hobby/dto/hobby.dto';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { UserDto } from '../../domaine/user/dto/user.dto';
import browserConfig from '../config/browser.config';
import selectorConfig from '../config/selector.config';
import { Logger } from 'winston';

@injectable()
export class ScrapingService implements IScrapingService {
  private page: Page;
  private browser: Browser;
  private baseUrl: string;
  private waitAfterActionLong: number
  private waitAfterActionShort: number
  

  constructor(
    @inject(TYPES.IUserService) private readonly userService: IUserService,
    @inject(TYPES.IHobbyService) private readonly hobbyService: IHobbyService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {
    this.baseUrl = process.env.BASE_SCRAPING_URL;
    this.waitAfterActionLong = parseInt(process.env.WAIT_AFTER_ACTION_LONG)
    this.waitAfterActionShort = parseInt(process.env.WAIT_AFTER_ACTION_SHORT)
  }

  async applyHobbies(hobbies: string[], pseudos: string[]): Promise<void> {
    const hobbies_list = [];
    for (const hobby of hobbies) {
      const hob = await this.hobbyService.findOneHobbyByName(
        hobby.trim().toUpperCase(),
      );
      if (!hob) {
        const hobDto = new HobbyDto();
        hobDto.name = hobby.trim().toUpperCase();
        await this.hobbyService.save(hobDto);
      }
    }

    for (const hobby of hobbies) {
      const hob = await this.hobbyService.findOneHobbyByName(
        hobby.trim().toUpperCase(),
      );
      hobbies_list.push(hob);
    }
    const hobbiesDto = hobbies_list.map((hob) => {
      const hobby = new HobbyDto();
      hobby.id = hob.id;
      hobby.name = hob.name;
      return hobby;
    });
    for (const pseudo of pseudos) {
      const user = await this.userService.findOneUser(pseudo);
      if (!user) {
        this.logger.info('user ' + pseudo + 'not found ');
      } else {
        await this.userService.addHobbies(pseudo, hobbiesDto);
        this.logger.info('hobbies added to' + pseudo);
      }
    }
  }

  async getAllInfos(
    force: boolean,
    cookiesFileName: string,
    pseudoList?: string[],
  ): Promise<void> {
    await this.initBrowser('/', cookiesFileName);
    if (pseudoList && pseudoList.length > 0) {
      for (const pseudo of pseudoList) {
        const user = await this.userService.findOneUser(pseudo);
        if (!user) {
          this.logger.info('user ' + pseudo + 'not found ');
          continue;
        }
        if (user.hasInfo && !force) {
          this.logger.info(
            'Les information de ' +
              pseudo +
              ' sont déjà présentes dans la base de données',
          );
          continue;
        } else {
          const userDto = await this.getInfoUserOnPage(pseudo);
          await this.userService.save(userDto);
        }
      }
    } else {
      const users = force
        ? await this.userService.findAll()
        : await this.userService.findAllWithNoInfo();
      for (const user of users) {
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
    pseudoList?: string[],
  ): Promise<void> {
    await this.initBrowser('/', cookiesFileName);
    if (pseudoList && pseudoList.length > 0) {
      for (const pseudo of pseudoList) {
        const user = await this.userService.findOneUser(pseudo);
        if (!user) {
          this.logger.info('user ' + pseudo + 'not found ');
          continue;
        }
        if (user.hasProcess && !force) {
          this.logger.info(
            'Les followers de ' +
              user.id +
              ' sont déjà présentes dans la base de données',
          );
          continue;
        } else {
          try {
            await this.page.goto(this.baseUrl + '/' + user.id, {
              waitUntil: 'networkidle',
            });
               await this.getFollowOfUser(user.id, Follow.FOLLOWER);
               await this.getFollowOfUser(user.id, Follow.FOLLOWING);
               user.hasProcess = true;
            await this.userService.save(user);
          } catch (error) {
            this.logger.error('getAllFollow', error);
          }
        }
      }
    } else {
      if (hobbies && hobbies.length > 0) {
        const users =
          await this.userService.findUsersWithSpecificHobbies(hobbies);

        for (const user of users) {
          if (user.hasProcess && !force) {
            this.logger.info(
              'Les followers de ' +
                user.id +
                ' sont déjà présentes dans la base de données',
            );
            continue;
          } else {
            try {
              await this.page.goto(this.baseUrl + '/' + user.id, {
                waitUntil: 'networkidle',
              });
              await this.getFollowOfUser(user.id, Follow.FOLLOWER);
              await this.getFollowOfUser(user.id, Follow.FOLLOWING);
              user.hasProcess = true;
              await this.userService.save(user);
            } catch (error) {
              this.logger.error('getAllFollow', error);
            }
          }
        }
      } else {
        const users = await this.userService.findUsersWithAtLeastOneHobby();
        for (const user of users) {
          if (user.hasProcess && !force) {
            this.logger.info(
              'Les followers de ' +
                user.id +
                ' sont déjà présentes dans la base de données',
            );
            continue;
          } else {
            try {
              await this.page.goto(this.baseUrl + '/' + user.id, {
                waitUntil: 'networkidle',
              });
              await this.getFollowOfUser(user.id, Follow.FOLLOWER);
              await this.getFollowOfUser(user.id, Follow.FOLLOWING);
             user.hasProcess = true;
              await this.userService.save(user);
            } catch (error) {
              this.logger.error('getAllFollow', error);
            }
          }
        }
      }
    }
    await this.closeBrowser();
  }

  private async initBrowser(suiteUrl: string, cookiesFileName?: string) {
    this.browser = await chromium.launch(browserConfig);
    const context: BrowserContext = await this.browser.newContext();
    context.setDefaultTimeout(parseInt(process.env.SELECTOR_TIMEOUT));
    context.setDefaultNavigationTimeout(
      parseInt(process.env.NAVIGATION_TIMEOUT),
    );

    // Autoriser les notifications
    const cookies = await import(
      process.env.COOKIES_JSON_DIR + '/' + cookiesFileName
    );

    await context.grantPermissions(['notifications'], {
      origin: this.baseUrl,
    });

    this.page = await context.newPage();

    await context.addCookies(cookies);

    const newUrl = this.baseUrl + (suiteUrl ? suiteUrl : '');
    await this.page.goto(newUrl); // Remplacez par l'URL désirée
    this.logger.info('Lancement du navigateur OK');
  }

  private async closeBrowser() {
    await this.browser.close();
  }

  private async parseNumberFromString(input: string): Promise<number | null> {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Retirer les espaces pour gérer les formats comme "1 256"
    input = input.replace(/\s+/g, '');

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
    const url = this.baseUrl + '/' + pseudo;
    await this.page.goto(url);
    await this.sleep(this.waitAfterActionShort);
    user.id = pseudo;

    try {
      user.nbFollowers = await this.parseNumberFromString(
        await this.page
          .locator(selectorConfig.pageInfo.nbFollowers)
          .first()
          .textContent(),
      );
    } catch (error) {
      this.logger.error(
        pseudo +
          " : impossible d'effectuer le selecteur '" +
          selectorConfig.pageInfo.nbFollowers +
          "'",
      );
    }

    try {
      const nbFollowingString = await this.page
        .locator(selectorConfig.pageInfo.nbFollowing)
        .first()
        .textContent();
      user.nbFollowing = await this.parseNumberFromString(nbFollowingString);
    } catch (error) {
      this.logger.error(
        pseudo +
          " : impossible d'effectuer le selecteur '" +
          selectorConfig.pageInfo.nbFollowing +
          "'",
      );
    }

    try {
      user.name = await this.page
        .locator(selectorConfig.pageInfo.name)
        .first()
        .textContent();
    } catch (error) {
      this.logger.error(
        pseudo +
          " : impossible d'effectuer le selecteur '" +
          selectorConfig.pageInfo.name +
          "'",
      );
    }

    try {
      user.biography = await this.page
        .locator(selectorConfig.pageInfo.biography)
        .first()
        .textContent();
    } catch (error) {
      this.logger.error(
        pseudo +
          " : impossible d'effectuer le selecteur '" +
          selectorConfig.pageInfo.biography +
          "'",
      );
    }
    user.hasInfo = true;
    return user;
  }

  private async scroll() {
    for (let i = 0; i < 3; i++) {
      await this.page.mouse.wheel(0, 600);

      await this.sleep(this.waitAfterActionShort);
    }
  }

  private async addFollowers(pseudo, userIds) {
    const users = userIds.map((id) => {
      const user = new UserDto();
      user.id = id;
      return user;
    });

    await this.userService.saveAll(users);
    await this.userService.addFollowers(pseudo, users);
  }

  private async addFollowings(pseudo, userIds) {
    const users = userIds.map((id) => {
      const user = new UserDto();
      user.id = id;
      return user;
    });

    await this.userService.saveAll(users);
    await this.userService.addFollowings(pseudo, users);
  }

  private async getFollowOfUser(pseudo: string, follow:Follow) {

    let buttonFollow
    if(follow === Follow.FOLLOWER){
      buttonFollow = selectorConfig.pageInfo.buttonFollower
    } else {
      buttonFollow = selectorConfig.pageInfo.buttonFollowing
    }
    // Utilisez page.locator pour cibler le bouton plus précisément
    try {
      const buttonFollowLocator = await this.page.waitForSelector(
        buttonFollow,
        { state: 'attached' },
      );
      // Vérifiez si le bouton est visible et cliquez dessus
      if (await buttonFollowLocator.isVisible()) {
        await buttonFollowLocator.click();
      } else {
        this.logger.info(
          "Le bouton follow n'a pas été trouvé ou n'est pas visible sur la page.",
        );
      }
    } catch (error) {
      this.logger.error(
        pseudo +
          " : impossible d'effectuer le selecteur '" +
          buttonFollow +
          "'",
      );
    }

    // Créer un locator pour l'élément que vous souhaitez faire défiler dans la vue
    const listView = await this.page.waitForSelector(
      selectorConfig.popupFollow.listView,
      { state: 'attached' },
    );

    await this.sleep(this.waitAfterActionLong);

    // Positionnez la souris sur l'élément
    await listView.hover();

    // Faire défiler la page vers le bas de 600 pixels
    await this.scroll();

    await this.sleep(this.waitAfterActionLong);

    //await this.page.waitForLoadState('networkidle');

    let usersShow = this.page.locator(
      selectorConfig.popupFollow.nameWithoutIndice,
    );
    let nbUsersShow = await usersShow.count();
    this.logger.debug('nbUsersShow = ' + nbUsersShow);
    let startIndice = 0;
    let nbGet = 0;
    do {
      const endIndice = nbUsersShow;
      const usersNames = [];

      for (let i = startIndice; i < endIndice; i++) {
        try {
          const pseudoFollowingSelector = await this.page.waitForSelector(
            selectorConfig.popupFollow.nameWithIndice.replace(
              '$indice',
              (i + 1).toString(),
            ),
            { state: 'attached' },
          );
          const text = await pseudoFollowingSelector.textContent();
          usersNames.push(text);
        } catch (error) {
          this.logger.error('pseudoFollowSelector error', error);
        }
      }

      if(follow == Follow.FOLLOWER){
        await this.addFollowers(pseudo, usersNames);
      }else{
        await this.addFollowings(pseudo, usersNames);
      }

      nbGet += usersNames.length;

      if(follow == Follow.FOLLOWER){
        this.logger.debug('Nombre de followers récupérés ' + nbGet);
      }else{
        this.logger.debug('Nombre de followings récupérés ' + nbGet);
      }
      this.logger.debug('Nombre affiche ' + nbUsersShow);

      // Faire défiler la page vers le bas de 600 pixels
      let retry = 0;
      do {
        retry++;
        await this.scroll();
        await this.sleep(this.waitAfterActionLong);
        //await this.page.waitForLoadState('networkidle');
        nbUsersShow = await usersShow.count();
      } while (nbUsersShow <= endIndice && retry < 2);

      startIndice = endIndice;
      this.logger.debug('nbUsersShow = ' + nbUsersShow);
      this.logger.debug('startIndice = ' + startIndice);
    } while (startIndice < nbUsersShow);

    await this.page.mouse.move(100, 100);
    await this.sleep(this.waitAfterActionShort);
    await this.page.mouse.click(100, 100);
    await this.sleep(this.waitAfterActionShort);
    //await this.page.waitForLoadState('networkidle');

    if(follow == Follow.FOLLOWER){
      this.logger.info('Nombre de followers récupérés ' + nbGet);
    }else{
      this.logger.info('Nombre de followings récupérés ' + nbGet);
    }
}

  private sleep(timeMilliSeconde: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve(); // Résoudre la promesse après le délai spécifié
      }, timeMilliSeconde);
    });
  }
}

enum Follow {
  FOLLOWER,
  FOLLOWING
}
