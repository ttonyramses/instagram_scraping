import { inject, injectable } from 'inversify';
import { IScrapingService } from '../interface/iscraping.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { IHobbyService } from '../../domaine/hobby/interface/ihobby.service';
import { HobbyDto } from '../../domaine/hobby/dto/hobby.dto';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { UserDto } from '../../domaine/user/dto/user.dto';
import { Logger } from 'winston';

@injectable()
export class ScrapingService implements IScrapingService {
  private page: Page;
  private browser: Browser;
  private baseUrl: string;
  private waitAfterActionLong: number;
  private waitAfterActionShort: number;

  constructor(
    @inject(TYPES.IUserService) private readonly userService: IUserService,
    @inject(TYPES.IHobbyService) private readonly hobbyService: IHobbyService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {
    this.baseUrl = process.env.BASE_SCRAPING_URL || 'https://www.instagram.com';
    this.waitAfterActionLong = parseInt(
      process.env.WAIT_AFTER_ACTION_LONG || '2000',
    );
    this.waitAfterActionShort = parseInt(
      process.env.WAIT_AFTER_ACTION_SHORT || '500',
    );
  }

  async applyHobbies(hobbies: string[], pseudos: string[]): Promise<void> {
    const hobbies_list = [];
    for (const hobby of hobbies) {
      let hob = await this.hobbyService.findOneHobbyByName(
        hobby.trim().toUpperCase(),
      );
      if (!hob) {
        const hobDto = new HobbyDto();
        hobDto.name = hobby.trim().toUpperCase();
        hob = await this.hobbyService.save(hobDto);
      }
      hobbies_list.push({ id: hob.id } as HobbyDto);
    }

    for (const pseudo of pseudos) {
      let user = await this.userService.findOneUser(pseudo);
      if (!user) {
        await this.userService.save({ id: pseudo } as UserDto);
      }
      await this.userService.addHobbies(pseudo, hobbies_list);
      this.logger.info('hobbies added to ' + pseudo);
    }
  }

  async getAllInfos(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    pseudoList?: string[],
  ): Promise<void> {
    await this.initBrowser('/', cookiesFileName);
    if (pseudoList && pseudoList.length > 0) {
      for (const pseudo of pseudoList) {
        const user = await this.userService.findOneUser(pseudo);
        if (!user) {
          this.logger.info('user ' + pseudo + ' not found ');
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
          const userDto = await this.getInfoUserOnPage(
            pseudo,
            selectorsFileName,
          );
          await this.userService.save(userDto);
        }
      }
    } else {
      const users = force
        ? await this.userService.findAll()
        : await this.userService.findAllWithNoInfo();
      for (const user of users) {
        const userDto = await this.getInfoUserOnPage(
          user.id,
          selectorsFileName,
        );
        await this.userService.save(userDto);
      }
    }
    await this.closeBrowser();
  }

  async getAllFollow(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    hobbies?: string[],
    pseudoList?: string[],
  ): Promise<void> {
    await this.initBrowser('/', cookiesFileName);
    if (pseudoList && pseudoList.length > 0) {
      for (const pseudo of pseudoList) {
        const user = await this.userService.findOneUser(pseudo);
        if (!user) {
          this.logger.info('user ' + pseudo + ' not found ');
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
            await this.getFollowOfUser(
              user.id,
              Follow.FOLLOWER,
              selectorsFileName,
            );
            await this.getFollowOfUser(
              user.id,
              Follow.FOLLOWING,
              selectorsFileName,
            );
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
              await this.getFollowOfUser(
                user.id,
                Follow.FOLLOWER,
                selectorsFileName,
              );
              await this.getFollowOfUser(
                user.id,
                Follow.FOLLOWING,
                selectorsFileName,
              );
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
              await this.getFollowOfUser(
                user.id,
                Follow.FOLLOWER,
                selectorsFileName,
              );
              await this.getFollowOfUser(
                user.id,
                Follow.FOLLOWING,
                selectorsFileName,
              );
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
    this.browser = await chromium.launch({
      headless: (process.env.HEADLESS || 'true') === 'true',
      args: ['--js-flags=--max-old-space-size=8192']
    });
    const context: BrowserContext = await this.browser.newContext();
    context.setDefaultTimeout(parseInt(process.env.SELECTOR_TIMEOUT || '5000'));
    context.setDefaultNavigationTimeout(
      parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
    );

    const cookies = await import(
      (process.env.COOKIES_JSON_DIR || '../../../.cookies') +
        '/' +
        cookiesFileName
    );

    // Autoriser les notifications
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

  private async getInfoUserOnPage(
    pseudo: string,
    selectorsFileName: string,
  ): Promise<UserDto> {
    const user = new UserDto();
    const url = this.baseUrl + '/' + pseudo;
    await this.page.goto(url);
    await this.sleep(this.waitAfterActionShort);
    user.id = pseudo;

    const selectorConfig = await import(
      (process.env.SELECTORS_JSON_DIR || '../../../.selectors') +
        '/' +
        selectorsFileName
    );

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

  private async getFollowOfUser(
    pseudo: string,
    follow: Follow,
    selectorsFileName: string,
  ) {
    this.page.on('console', (message) => {
      this.logger.debug(`Console context page : ${message.text()}`);
    });
    const selectorConfig = await import(
      (process.env.SELECTORS_JSON_DIR || '../../../.selectors') +
        '/' +
        selectorsFileName
    );

    let buttonFollow;
    if (follow === Follow.FOLLOWER) {
      this.logger.info('Debut des traitements des followers pour le pseudo '+pseudo)
      buttonFollow = selectorConfig.pageInfo.buttonFollower;
    } else {
      this.logger.info('Debut des traitements des followings pour le pseudo '+pseudo)
      buttonFollow = selectorConfig.pageInfo.buttonFollowing;
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
      return;
    }

    //await this.sleep(this.waitAfterActionLong);
    await this.page.waitForLoadState('domcontentloaded');

    // const searchString = '0123456789abcdefghijklmnopqrstuvwxyz';
    let nbGet = 0;
    const pseudoSet = new Set();
    await this.sleep(this.waitAfterActionLong);

    /* let usersShow = this.page.locator(
      selectorConfig.popupFollow.pseudoFollow,
    );
    let nbUsersShow = await usersShow.count();
    this.logger.debug('nbUsersShow = ' + nbUsersShow);
    let startIndice = 0; */

    const sizeLot = parseInt(process.env.NB_FOLLOW_SIZE_PROCESS_BLOC || '1000');
    try {
      const listView = await this.page.waitForSelector(
        selectorConfig.popupFollow.listView,
        { state: 'attached' },
      );
      await this.sleep(this.waitAfterActionLong);
      // Positionnez la souris sur l'élément
      await listView.hover();
    } catch (error) {
      this.logger.error('PB scrolling ', error);
    }
    let usersPseudoLocator = this.page.locator(
      selectorConfig.popupFollow.pseudoFollow,
    );

    let startIndice = 0;
    let doBoucleDoWhile = false;
    let indice = 0;
    do {
      indice++;
      let nbElement = await usersPseudoLocator.count();
      let lastNbElement = nbElement;
      do {
        lastNbElement = nbElement;
        await this.scroll();
        await this.scroll();
        await this.scroll();
        await this.sleep(this.waitAfterActionLong);
        nbElement = await usersPseudoLocator.count();
      } while (nbElement < (sizeLot * indice) && nbElement > lastNbElement);
      doBoucleDoWhile = nbElement > lastNbElement;
      this.logger.debug('startIndice = '+startIndice+' endIndice = '+nbElement+ ' doBoucleDoWhile = '+doBoucleDoWhile)

      this.logger.info('traitement du '+indice+'e lot de '+sizeLot)
      const usersNames = [];
      if (nbElement > 0) {
        const allElement = await usersPseudoLocator.all();
        for (let i= startIndice; i< nbElement; i++) {
          try {
            const text = await allElement[i].textContent();
            /* if (!pseudoSet.has(text)) {
              pseudoSet.add(text);
            } */
            usersNames.push(text);
            nbGet++;


            if (
              nbGet % parseInt(process.env.NB_FOLLOW_LOG_PROCESS || '1000') ==
              0
            ) {
              if (follow == Follow.FOLLOWER) {
                this.logger.info('Nombre de followers traités ' + nbGet);
              } else {
                this.logger.info('Nombre de followings traités ' + nbGet);
              }
            }
          } catch (error) {
            this.logger.error('pseudoFollowSelector error', error);
          }
        }
        startIndice=nbElement
        //sauvegarde en base de données
        if (follow == Follow.FOLLOWER) {
          await this.addFollowers(pseudo, usersNames);
        } else {
          await this.addFollowings(pseudo, usersNames);
        }

        //suppression de tous les elements de la listview des pseudos pour alléger le DOM
        //on supprime que les 100 premier elements

        /*console.log('Debut de la suppression des elements du DOM');
        await this.page.evaluate(
          (arg: { selector: string; sizeNotRemoveNode: number }) => {
            const elementToRemove = document.querySelector(arg.selector);
            if (elementToRemove.hasChildNodes()) {
              console.log(
                'suppression des enfants de la node ',
                elementToRemove,
              );
              removeAllChildren(elementToRemove);
            }

            function removeAllChildren(node) {
              const nbChild = node.childElementCount;
              console.log('nombre de node enfants :', nbChild)
              console.log('sizeNotRemoveNode :', arg.sizeNotRemoveNode)
              let i = 0;
              // Tant que le nœud a des enfants, les supprimer un par un et que le nombre ne depasse, le nombre de neaud initial on le supprime
              //en effet pendant la suppression intagram recharge de nouveau noeuds, ceux ci il ne faut pas les supprimer
              for (let i = 0; i < nbChild - arg.sizeNotRemoveNode; i++) {
                // Utilise une promesse pour créer une attente asynchrone
                node.firstChild.remove();

            }
              // Vous pouvez choisir de gérer l'erreur ici, par exemple en affichant un message à l'utilisateur ou en effectuant une autre action
            }
          },
          {
            selector: selectorConfig.popupFollow.listView,
            sizeNotRemoveNode: sizeNotRemoveNode,
          },
        );
        console.log('FIN de la suppression des elements du DOM');
        await this.sleep(this.waitAfterActionLong);*/
      }
    } while (doBoucleDoWhile);

    await this.page.mouse.move(100, 100);
    await this.sleep(this.waitAfterActionShort);
    await this.page.mouse.click(100, 100);
    await this.sleep(this.waitAfterActionShort);

    if (follow == Follow.FOLLOWER) {
      this.logger.info('Nombre total de followers traités ' + nbGet);
    } else {
      this.logger.info('Nombre total de followings traités ' + nbGet);
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
  FOLLOWING,
}
