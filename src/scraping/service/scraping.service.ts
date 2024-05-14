import { inject, injectable } from 'inversify';
import { IScrapingService } from '../interface/iscraping.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { IHobbyService } from '../../domaine/hobby/interface/ihobby.service';
import { HobbyDto } from '../../domaine/hobby/dto/hobby.dto';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { UserDto } from '../../domaine/user/dto/user.dto';
import { Logger } from 'winston';
import { Lock } from 'async-await-mutex-lock';
import { Follow, UserListResponse } from '../type';

@injectable()
export class ScrapingService implements IScrapingService {
  private page: Page;
  private browser: Browser;
  private baseUrl: string;
  private waitAfterActionLong: number;
  private waitAfterActionShort: number;
  private nbFollowProcess: number;
  private stopCallApi: boolean;
  private lock = new Lock();
  private allFollowProcess = new Set();

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
    follow: Follow,
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    maxId: string,
    nbFollow: number,
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
            'Les follow(ers/ings) de ' +
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
              follow,
              selectorsFileName,
              maxId,
              nbFollow,
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
                follow,
                selectorsFileName,
                maxId,
                nbFollow,
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
                follow,
                selectorsFileName,
                maxId,
                nbFollow,
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
    maxId: string,
    nbFollow: number,
  ) {
    this.page.on('console', (message) => {
      this.logger.debug(`Console context page : ${message.text()}`);
    });
    const selectorConfig = await import(
      (process.env.SELECTORS_JSON_DIR || '../../../.selectors') +
        '/' +
        selectorsFileName
    );

    let endProcess = false;
    let SIZE: number = 25;
    new Promise((resolve, reject) => {
      this.page.on('request', (request) => {
        const regex = /\/api\/v1\/friendships\/(\d+)\/(follow.*?)/;
        const match = regex.exec(request.url());
        const headers = request.headers();

        if (request.resourceType() === 'xhr' && match) {
          resolve({
            url: request.url().replace('count=12', 'count=25'),
            headers,
          }); // Résoudre la promesse avec l'URL interceptée
        }
      });
    }).then(async (option: { url: string; headers: any }) => {
      //c'est ici qu'on va faire tous les appel api

      this.nbFollowProcess = 0;
      const nbQuery = Math.ceil(nbFollow / SIZE);
      this.stopCallApi = false;
      this.logger.debug('nbQuery =' + nbQuery);
      for (let i = 0; i < nbQuery; i++) {
        //   for (let i = 0; i < 10; i++) {
        const newUrl = `${option.url}&max_id=${maxId}`;
        this.logger.debug('newUrl = ' + newUrl);
        maxId = await this.callApiAndSaveBdd(option, newUrl, follow, pseudo);
        // await this.sleep(100)
       // maxId = Number(maxId) + Number(SIZE);

        if (i % parseInt(process.env.NB_FOLLOW_QUERY_PROCESS || '100') == 0) {
          await this.sleep(5_000);
        }
        if (this.stopCallApi) {
          this.logger.debug('break');
          break;
        }
      }

      //await this.sleep(this.waitAfterActionLong);
      await this.page.waitForLoadState('domcontentloaded');

      await this.page.mouse.move(100, 100);
      await this.sleep(this.waitAfterActionShort);
      await this.page.mouse.click(100, 100);
      await this.sleep(this.waitAfterActionShort);

      if (follow == Follow.FOLLOWER) {
        this.logger.info(
          'Nombre total de followers traités ' + this.nbFollowProcess,
        );
        this.logger.info(
          'Nombre total de followers sauvegardé en bdd ' +
            this.allFollowProcess.size,
        );
      } else {
        this.logger.info(
          'Nombre total de followings traités ' + this.nbFollowProcess,
        );
        this.logger.info(
          'Nombre total de followings sauvegardé en bdd ' +
            this.allFollowProcess.size,
        );
      }

      this.logger.debug(
        'allFollowProcess = ' + Array.from(this.allFollowProcess).join(', '),
      );

      endProcess = true;
    });

    let buttonFollow;
    if (follow === Follow.FOLLOWER) {
      this.logger.info(
        'Debut des traitements des followers pour le pseudo ' + pseudo,
      );
      buttonFollow = selectorConfig.pageInfo.buttonFollower;
    } else {
      this.logger.info(
        'Debut des traitements des followings pour le pseudo ' + pseudo,
      );
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
        this.logger.info('click sur le bouton follow');
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

    do {
      // on test toute les 5s seconde si le process est fini
      await this.sleep(5_000);
    } while (!endProcess);
  }

  private async callApiAndSaveBdd(
    option: { url: string; headers: any },
    newUrl: string,
    follow: Follow,
    pseudo: string,
  ): Promise<string> {
    const responseData = (await this.page.evaluate(
      async (args: { url: string; headers: any }) => {
        try {
          const response = await fetch(args.url, {
            headers: args.headers || {},
          });

          if (!response.ok) {
            throw new Error('Error insta api ' + args.url);
          }
          const dataJson = await response.json();
          return dataJson;
        } catch (error) {
          this.logger.error('Error: ' + error);
        }
      },
      { ...option, url: newUrl },
    )) as UserListResponse;

    if (responseData) {
      this.logger.debug(
        'user follow = ' + responseData.users.map((user) => user.username),
      );
      this.logger.debug('next_max_id = ' + responseData.next_max_id);
      this.stopCallApi = !responseData.big_list;
      const usersNames = [];
      //sauvegarde des element un bdd
      for (let user of responseData.users) {
        try {
          usersNames.push(user.username);
          this.allFollowProcess.add(user.username);
          this.nbFollowProcess++;

          if (
            this.nbFollowProcess %
              parseInt(process.env.NB_FOLLOW_LOG_PROCESS || '1000') ==
            0
          ) {
            if (follow == Follow.FOLLOWER) {
              this.logger.info(
                'Nombre de followers traités ' + this.nbFollowProcess,
              );
            } else {
              this.logger.info(
                'Nombre de followings traités ' + this.nbFollowProcess,
              );
            }
          }
        } catch (error) {
          this.logger.error('pseudoFollowSelector error', error);
        }
      }

      //etant données que cette fonction est multithread, la sauvegarde des données est synchronisée pour éviter les erreurs de sauvegarde en bdd
      await this.lock.acquire();

      try {
        // console.log('userNames =',usersNames)
        if (follow == Follow.FOLLOWER) {
          await this.addFollowers(pseudo, usersNames);
        } else {
          await this.addFollowings(pseudo, usersNames);
        }
      } finally {
        //console.log('releases lock')
        this.lock.release();
      }

      return responseData.next_max_id;
    } else {
      throw new Error('Error call api');
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
