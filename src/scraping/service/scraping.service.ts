import { inject, injectable } from 'inversify';
import { IScrapingService } from '../interface/iscraping.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { IHobbyService } from '../../domaine/hobby/interface/ihobby.service';
import { HobbyDto } from '../../domaine/hobby/dto/hobby.dto';
import {
  Browser,
  BrowserContext,
  BrowserType,
  Page,
  chromium,
  firefox,
  webkit,
} from 'playwright';
import { UserDto } from '../../domaine/user/dto/user.dto';
import { Logger } from 'winston';
import { Lock } from 'async-await-mutex-lock';
import { Follow, UserListResponse, UserProfileResponse } from '../type';
import { User } from 'src/domaine/user/entity/user.entity';
import { Pool, Worker, spawn } from 'threads';

@injectable()
export class ScrapingService implements IScrapingService {
  private page: Page;
  private context: BrowserContext;
  private browser: Browser;
  private baseUrl: string;
  private waitAfterActionLong: number;
  private waitAfterActionShort: number;
  private nbItemProcess: number;
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
    this.nbItemProcess = 0;
    await this.initBrowser('/', chromium, cookiesFileName, selectorsFileName);
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
          await this.getAndSaveInfoUser(pseudo);
        }
      }
    } else {
      const users = force
        ? await this.userService.findAll()
        : await this.userService.findAllWithNoInfo();
      let i = 0;

      const pool = Pool(
        () => spawn(new Worker('../multithreading/worker')),
        parseInt(
          process.env.NB_THREAD_GET_INFO_USER || '10',
        ) /* optional size */,
      );

      const blockSize = parseInt(
        process.env.BLOCK_SIZE_THREAD_GET_INFO_USER || '5000',
      );
      let indexBloc = 0;
      for (let i = 0; i < users.length; i += blockSize) {
        indexBloc++;
        let block_users = users.slice(i, i + blockSize);
        this.logger.info(
          'start init Tasks for getAllInfo User block N° ' + indexBloc,
        );
        const tasks = block_users.map((user) => {
          return pool.queue(
            async (worker) => await this.getAndSaveInfoUser(user.id),
          );
        });
        this.logger.info(
          'end init Tasks for getAllInfo User block N° ' + indexBloc,
        );

        await Promise.all(tasks);
        await pool.completed();
        await pool.terminate();
      }
    }
    await this.closeBrowser();
    this.logger.info(
      'Nombre total des utilisateurs mise à jour : ' + this.nbItemProcess,
    );
  }

  private async getAndSaveInfoUser(pseudo: string) {
    const userDto = await this.getInfoUserOnPage(pseudo);
    this.logger.info(`userDto = ${JSON.stringify(userDto)}`);
    if (userDto.nbFollowers != undefined && userDto.nbFollowings != undefined) {
      await this.userService.save(userDto);
    }
    this.nbItemProcess++;
    if (
      this.nbItemProcess %
        parseInt(process.env.NB_FOLLOW_LOG_PROCESS || '1000') ==
      0
    ) {
      this.logger.info(
        'Nombre des utilisateurs mise à jour : ' + this.nbItemProcess,
      );
    }
    if (
      this.nbItemProcess == parseInt(process.env.MAX_USER_UPDATE || '50000')
    ) {
      throw new Error(
        `Nombre maximal de utilisateur a traiter atteint soit (${this.nbItemProcess}), fin du programme`,
      );
    }
    await this.sleep(this.getRandomNumber(3000, 12000));
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
    await this.initBrowser('/', chromium, cookiesFileName);
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
        const users = await this.userService.findUsersWithAtLeastOneHobby();
        for (const user of users) {
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
      }
    }
    await this.closeBrowser();
  }

  private async initBrowser(
    suiteUrl: string,
    browserType: BrowserType,
    cookiesFileName?: string,
    selectorsFileName?: string,
  ) {
    this.browser = await browserType.launch({
      headless: (process.env.HEADLESS || 'true') === 'true',
    });
    this.context = await this.browser.newContext();
    this.context.setDefaultTimeout(
      parseInt(process.env.SELECTOR_TIMEOUT || '5000'),
    );
    this.context.setDefaultNavigationTimeout(
      parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
    );

    await this.context.clearCookies();

    if (cookiesFileName) {
      const cookies = await import(
        (process.env.COOKIES_JSON_DIR || '../../../.cookies') +
          '/' +
          cookiesFileName
      );
      await this.context.addCookies(cookies);
    }

    // Autoriser les notifications
    await this.context.grantPermissions(['notifications'], {
      origin: this.baseUrl,
    });

    this.page = await this.context.newPage();

    const newUrl = this.baseUrl + (suiteUrl ? suiteUrl : '');
    await this.page.goto(newUrl); // Remplacez par l'URL désirée

    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    //Pour clicker sur le bouton autoriser les cookies
    if (selectorsFileName && !cookiesFileName) {
      const selectorConfig = await import(
        (process.env.SELECTORS_JSON_DIR || '../../../.selectors') +
          '/' +
          selectorsFileName
      );

      const buttonAuthoriseCookiesSelector =
        selectorConfig.pageInfo.buttonAuthoriseCookies;
      try {
        this.logger.info('clique sur le bouton autoriser les cookies');
        await this.sleep(this.waitAfterActionLong);
        await this.page.locator(buttonAuthoriseCookiesSelector).click();
      } catch (error) {
        this.logger.error(
          "impossible d'effectuer le selecteur '" +
            buttonAuthoriseCookiesSelector +
            "'",
        );
      }
    }

    this.logger.info('Lancement du navigateur OK');
  }

  private async closeBrowser() {
    await this.browser.close();
  }

  private async getInfoUserOnPage(pseudo: string): Promise<UserDto> {
    const user = new UserDto();
    const url = this.baseUrl + '/' + pseudo;
    const myPage: Page = await this.context.newPage();

    user.id = pseudo;

    let endProcess = true;

    new Promise((resolve, reject) => {
      let hasGetInfo = false;
      myPage.on('request', async (request) => {
        const regexGraphQl = /\/api\/graphql/;
        const matchGraphQl = regexGraphQl.exec(request.url());

        const regexBulkRoute = /ajax\/bulk-route-definitions/;
        const matchBulkRoute = regexBulkRoute.exec(request.url());

        const regexLoginPage = /\/api\/v1\/web\/login_page/;
        const matchLoginPage = regexLoginPage.exec(request.url());

        if (request.resourceType() === 'xhr' && matchGraphQl && !hasGetInfo) {
          try {
            const response = await request.response();
            const body = await response.json();
            // this.logger.info(`body  ${pseudo}  = ${JSON.stringify(body)}`);
            if (body.data.user != undefined) {
              endProcess = false;
              hasGetInfo = true;
              resolve(body);
            }
          } catch (error) {
            this.logger.error(
              `erreur get response for url ${request.url()} error: ${error.message}`,
            );
          }
        } else if (request.resourceType() === 'xhr' && matchBulkRoute) {
          await this.sleep(2_000);
          if (!hasGetInfo) {
            this.logger.info(
              `${pseudo} : ce pseudo est certainement desactivé`,
            );
            user.nbFollowers = 0;
            user.nbFollowings = 0;
            user.enable = false;
            user.hasInfo = true;
          }
        } else if (request.resourceType() === 'xhr' && matchLoginPage) {
          this.logger.info(`Vous êtes deja blacklistés par instagram`);
          throw new Error('Veuillez changer de poste ou de IP');
        }
      });
    }).then(async (response: UserProfileResponse) => {
      user.name = response.data.user.full_name;
      user.biography = response.data.user.biography;
      user.nbFollowers = response.data.user.follower_count;
      user.nbFollowings = response.data.user.following_count;
      user.nbPublications = response.data.user.media_count;
      user.intagramId = response.data.user.pk;
      user.facebookId = response.data.user.fbid_v2;
      user.category = response.data.user.category;
      user.externalUrl = response.data.user.external_url;
      user.profileUrl = response.data.user.hd_profile_pic_url_info.url;
      user.hasInfo = true;
      user.enable = true;
      endProcess = true;
    });

    try {
      await myPage.goto(url);
    } catch (error) {
      this.logger.error(`erreur go to page ${url} ${error.message}`);
      return user;
    }

    do {
      // on test toute les 500 ms si le process est fini
      await this.sleep(500);
      if (endProcess) {
        await myPage.close();
        return user;
      }
    } while (!endProcess);
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
      if (message.type() === 'error') {
        this.logger.error(`Console error context page : ${message.text()}`);
      } else {
        this.logger.debug(`Console context page : ${message.text()}`);
      }
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

      this.nbItemProcess = 0;
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
          await this.sleep(2_000);
        }
        if (this.stopCallApi) {
          this.logger.debug('break');
          break;
        }
      }

      this.logger.info('pseudo = ' + pseudo + ' , last max_id = ' + maxId);

      //await this.sleep(this.waitAfterActionLong);
      await this.page.waitForLoadState('domcontentloaded');

      await this.page.mouse.move(100, 100);
      await this.sleep(this.waitAfterActionShort);
      await this.page.mouse.click(100, 100);
      await this.sleep(this.waitAfterActionShort);

      if (follow == Follow.FOLLOWER) {
        this.logger.info(
          'Nombre total de followers traités ' + this.nbItemProcess,
        );
        this.logger.info(
          'Nombre total de followers sauvegardé en bdd ' +
            this.allFollowProcess.size,
        );
      } else {
        this.logger.info(
          'Nombre total de followings traités ' + this.nbItemProcess,
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
      // this.logger.debug(
      //   'user follow = ' + responseData.users.map((user) => user.username),
      // );
      this.logger.debug(
        'pseudo = ' + pseudo + '  next_max_id = ' + responseData.next_max_id,
      );
      this.stopCallApi = !responseData.big_list;
      const usersNames = [];
      //sauvegarde des element un bdd
      for (let user of responseData.users) {
        try {
          usersNames.push(user.username);
          this.allFollowProcess.add(user.username);
          this.nbItemProcess++;

          if (
            this.nbItemProcess %
              parseInt(process.env.NB_FOLLOW_LOG_PROCESS || '1000') ==
            0
          ) {
            if (follow == Follow.FOLLOWER) {
              this.logger.info(
                'Nombre de followers traités ' + this.nbItemProcess,
              );
            } else {
              this.logger.info(
                'Nombre de followings traités ' + this.nbItemProcess,
              );
            }
            this.logger.info('next_max_id = ' + responseData.next_max_id);
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

  private getRandomNumber(min: number = 0, max: number = 100): number {
    if (min >= max) {
      throw new Error(
        "Le paramètre 'min' doit être strictement inférieur à 'max'.",
      );
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
