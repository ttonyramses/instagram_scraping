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
import {
  Follow,
  User2ProfileResponse,
  UserListResponse,
  UserProfileResponse,
} from '../type';
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
  private headersRequest: { [key: string]: string };
  private bodyRequest: URLSearchParams;
  private urlRequest: string;

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
    await this.initBrowser(
      '/topchretien',
      chromium,
      cookiesFileName,
      selectorsFileName,
    );
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
          await this.getAndSaveInfoUser(user);
        }
      }
    } else {
      const users = force
        ? await this.userService.findAll()
        : await this.userService.findAllWithNoInfo();
      let i = 0;

      const blockSize = parseInt(
        process.env.BLOCK_SIZE_THREAD_GET_INFO_USER || '5000',
      );
      let indexBloc = 0;
      this.logger.info('nombre compte à traiter :  ' + users.length);
      for (let i = 0; i < users.length; i += blockSize) {
        indexBloc++;
        let block_users = users.slice(i, i + blockSize);
        this.logger.info(
          'start init Tasks for getAllInfo User block N° ' + indexBloc,
        );
        const pool = Pool(
          () => spawn(new Worker('../multithreading/worker')),
          parseInt(
            process.env.NB_THREAD_GET_INFO_USER || '10',
          ) /* optional size */,
        );

        let stopProcessing = false;
        const tasks = block_users.map((user) => {
          return pool.queue(async (worker) => {
            if (stopProcessing) {
              return Promise.reject('Processing stopped');
            }
            try {
              if (
                this.nbItemProcess ==
                parseInt(process.env.MAX_USER_UPDATE || '50000')
              ) {
                stopProcessing = true;
                this.logger.info(
                  `Nombre maximal de utilisateur a traiter atteint soit (${this.nbItemProcess}), fin du programme`,
                );
                return Promise.reject('Processing stopped');
              }
              await this.getAndSaveInfoUser(user);
            } catch (error) {
              this.logger.error(error);
              stopProcessing = true;
            }
          });
        });
        this.logger.info(
          'end init Tasks for getAllInfo User block N° ' + indexBloc,
        );

        try {
          await Promise.all(tasks);
        } catch (error) {
          this.logger.error(error);
        } finally {
          try {
            await pool.terminate();
          } catch (error) {}
        }
        if (stopProcessing) {
          break;
        }
      }
    }
    // await this.sleep(500_000);
    await this.closeBrowser();
    this.logger.info(
      'Nombre total des utilisateurs mise à jour : ' + this.nbItemProcess,
    );
  }

  private async getAndSaveInfoUser(user: UserDto) {
    const userDto = await this.getInfoUserApiByPseudo(user.id);
    /*
    if (user.instagramId) {
      userDto = await this.getInfoUserByApi(user.instagramId, user.id);
    } else {
      return;
      // userDto = await this.getInfoUserOnPage(user.id);
    }
    */

    if (userDto.nbFollowers != undefined && userDto.nbFollowings != undefined) {
      this.logger.debug(`save userDto = ${JSON.stringify(userDto)}`);
      await this.userService.save(userDto);
    } else {
      this.logger.debug(`not save userDto = ${JSON.stringify(userDto)}`);
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

    await this.sleep(this.getRandomNumber(500, 2000));
  }

  private async getInfoUserApiByPseudo(pseudo: string): Promise<UserDto> {
    //console.log('headersRequest = ', this.headersRequest);
    const response = await fetch(
      encodeURI(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${pseudo}`,
      ),
      {
        method: 'GET',
        headers: this.headersRequest,
      },
    );
    const user = new UserDto();
    user.id = pseudo;

    if (!response.ok) {
      this.logger.error(`pseudo ${pseudo} : erreur http ${response.status}`);

      if (response.status === 404) {
        this.logger.debug(`${pseudo} : ce pseudo est certainement desactivé`);
        user.nbFollowers = 0;
        user.nbFollowings = 0;
        user.enable = false;
        user.hasInfo = true;
        return user;
      } else {
        throw new Error(
          `pseudo ${pseudo} : Veuillez rapidement reactiver votre compte`,
        );
      }
    } else {
      this.logger.debug(`pseudo ${pseudo} : status http ${response.status} OK`);
    }

    const userResponse: User2ProfileResponse = await response.json();

    if (userResponse && userResponse.data && userResponse.data.user) {
      user.name = userResponse.data.user.full_name;
      user.biography = userResponse.data.user.biography;
      user.nbFollowers = userResponse.data.user.edge_followed_by.count;
      user.nbFollowings = userResponse.data.user.edge_follow.count;
      user.nbPublications =
        userResponse.data.user.edge_owner_to_timeline_media.count;
      user.instagramId = userResponse.data.user.id;
      user.facebookId = userResponse.data.user.fbid;
      user.category = userResponse.data.user.category_name;
      user.externalUrl = userResponse.data.user.external_url;
      user.profileUrl = userResponse.data.user.profile_pic_url_hd;
      user.hasInfo = true;
      user.enable = true;
    } else {
      this.logger.debug(`${pseudo} : ce pseudo est certainement desactivé`);
      user.nbFollowers = 0;
      user.nbFollowings = 0;
      user.enable = false;
      user.hasInfo = true;
    }
    return user;
  }

  private async getInfoUserByApi(
    instagramId: number,
    pseudo: string,
  ): Promise<UserDto> {
    const variables = `{"id":"${instagramId}","render_surface":"PROFILE"}`;
    const __spin_t = Math.floor(Date.now() / 1000);
    this.bodyRequest.set('variables', variables);
    this.bodyRequest.set('__spin_t', __spin_t.toString());
    // console.log('urlRequest = ', this.urlRequest)
    // console.log('headersRequest = ', this.headersRequest)
    // console.log('bodyRequest = ', this.bodyRequest)

    const response = await fetch(this.urlRequest, {
      method: 'POST',
      headers: this.headersRequest,
      body: this.bodyRequest,
    });
    const user = new UserDto();
    user.id = pseudo;

    if (!response.ok) {
      this.logger.error(`pseudo ${pseudo} : erreur http ${response.status}`);

      if (response.status === 404) {
        this.logger.debug(`${pseudo} : ce pseudo est certainement desactivé`);
        user.nbFollowers = 0;
        user.nbFollowings = 0;
        user.enable = false;
        user.hasInfo = true;
        return user;
      } else {
        throw new Error(
          `pseudo ${pseudo} : Veuillez rapidement reactiver votre compte`,
        );
      }
    } else {
      this.logger.debug(`pseudo ${pseudo} : status http ${response.status} OK`);
    }

    const userResponse: UserProfileResponse = await response.json();

    //console.log('userResponse = ', userResponse);

    if (userResponse && userResponse.data && userResponse.data.user) {
      user.name = userResponse.data.user.full_name;
      user.biography = userResponse.data.user.biography;
      user.nbFollowers = userResponse.data.user.follower_count;
      user.nbFollowings = userResponse.data.user.following_count;
      user.nbPublications = userResponse.data.user.media_count;
      user.instagramId = userResponse.data.user.pk;
      user.facebookId = userResponse.data.user.fbid_v2;
      user.category = userResponse.data.user.category;
      user.externalUrl = userResponse.data.user.external_url;
      user.profileUrl = userResponse.data.user.hd_profile_pic_url_info.url;
      user.hasInfo = true;
      user.enable = true;
    } else {
      this.logger.debug(`${pseudo} : ce pseudo est certainement desactivé`);
      user.nbFollowers = 0;
      user.nbFollowings = 0;
      user.enable = false;
      user.hasInfo = true;
    }

    return user;
  }

  private async getInfoUserOnPage(pseudo: string): Promise<UserDto> {
    const user = new UserDto();
    const url = this.baseUrl + '/' + pseudo;
    const myPage: Page = await this.context.newPage();

    user.id = pseudo;

    let endProcess = false;

    new Promise((resolve, reject) => {
      let hasGetInfo = false;
      myPage.on('response', async (response) => {
        const request = response.request();
        const regexGraphQl = /\/api\/graphql|\/graphql\/query/;
        const matchGraphQl = regexGraphQl.exec(request.url());

        const regexBulkRoute = /ajax\/bulk-route-definitions/;
        const matchBulkRoute = regexBulkRoute.exec(request.url());

        const regexLoginPage =
          /\/api\/v1\/web\/login_page|\/accounts\/suspended/;
        const matchLoginPage = regexLoginPage.exec(request.url());

        let isBlacklisted = false;

        //console.log('request.resourceType() = ', request.resourceType(), '     request.url() = ', request.url());

        if (request.resourceType() === 'xhr' && matchLoginPage) {
          this.logger.info('Vous êtes déjà blacklistés par instagram');
          endProcess = true;
          throw new Error('Veuillez changer de poste ou de IP');
        } else if (
          request.resourceType() === 'xhr' &&
          matchGraphQl &&
          !hasGetInfo
        ) {
          const postData = request.postData();
          const payload = new URLSearchParams(postData);
          try {
            const variables = payload.get('variables');

            if (variables) {
              const variablesObj = JSON.parse(variables);
              if (variablesObj.render_surface === 'PROFILE') {
                if (response.status() === 200) {
                  const textBody = await response.text();
                  const body = JSON.parse(textBody);
                  if (body.data.user != undefined) {
                    endProcess = false;
                    hasGetInfo = true;
                    resolve(body);
                  }
                } else {
                  isBlacklisted = true;
                }
              }
            }
          } catch (error) {
            this.logger.error(
              `erreur get response for url ${request.url()} error: ${error.message}`,
            );
          }

          if (isBlacklisted) {
            endProcess = true;
            this.logger.info('Vous êtes déjà blacklistés par instagram');
            throw new Error('Veuillez changer de poste ou de IP');
          }
        } else if (request.resourceType() === 'xhr' && matchBulkRoute) {
          await this.sleep(2_000);
          if (!hasGetInfo) {
            this.logger.debug(
              `${pseudo} : ce pseudo est certainement desactivé`,
            );
            user.nbFollowers = 0;
            user.nbFollowings = 0;
            user.enable = false;
            user.hasInfo = true;
            endProcess = true;
          }
        }
      });
    }).then((response: UserProfileResponse) => {
      user.name = response.data.user.full_name;
      user.biography = response.data.user.biography;
      user.nbFollowers = response.data.user.follower_count;
      user.nbFollowings = response.data.user.following_count;
      user.nbPublications = response.data.user.media_count;
      user.instagramId = response.data.user.pk;
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

    return new Promise((resolve, reject) => {
      // Fonction à exécuter de manière répétée
      const intervalID = setInterval(async () => {
        if (endProcess) {
          await myPage.close();
          clearInterval(intervalID);
          clearTimeout(timeoutID);
          resolve(user);
        }
      }, 500);

      // Arrêter l'exécution après le délai spécifié et résoudre la promesse
      const timeoutID = setTimeout(async () => {
        clearInterval(intervalID);
        await myPage.close();
        resolve(user);
      }, 10_000);
    });
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
    await this.initBrowser('/topchretien', chromium, cookiesFileName);
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

    let endProcess = false;
    let hasGetInfo = false;
    let reload = false;
    this.page.on('response', async (response) => {
      const request = response.request();
      //console.log(request.url());
      const regexGraphQl = /\/api\/graphql|\/graphql\/query/;
      const matchGraphQl = regexGraphQl.exec(request.url());

      const regexLoginSuspendedPage =
        /\/api\/v1\/web\/login_page|\/accounts\/suspended|\/accounts\/login/;
      const matchLoginSuspendedPage = regexLoginSuspendedPage.exec(
        request.url(),
      );

      const regexReloadUrl = /\/ajax\/bz/;
      const matchReloadUrl = regexReloadUrl.exec(request.url());

      let isBlacklisted = false;

      //console.log('request.resourceType() = ', request.resourceType(), '     request.url() = ', request.url());

      if (request.resourceType() === 'xhr' && matchLoginSuspendedPage) {
        isBlacklisted = true;
      } else if (
        request.resourceType() === 'xhr' &&
        matchGraphQl &&
        !hasGetInfo
      ) {
        const postData = request.postData();
        const payload = new URLSearchParams(postData);
        try {
          const variables = payload.get('variables');

          if (variables) {
            const variablesObj = JSON.parse(variables);
            if (
              variablesObj.render_surface === 'PROFILE' ||
              variablesObj.device_id
            ) {
              if (response.status() === 200) {
                const allHeaders = await request.allHeaders();
                this.headersRequest = await request.headers();
                this.headersRequest['cookie'] = allHeaders['cookie'];
                this.bodyRequest = payload;
                this.urlRequest = request.url();

                endProcess = true;
                hasGetInfo = true;
              } else {
                isBlacklisted = true;
                endProcess = true;
              }
            }
          }
        } catch (error) {
          this.logger.error(
            `erreur get response for url ${request.url()} error: ${error.message}`,
          );
        }
      } else if (
        request.resourceType() === 'xhr' &&
        matchReloadUrl &&
        !hasGetInfo
      ) {
        reload = true;
      }

      if (isBlacklisted) {
        endProcess = true;
        this.logger.info('Vous êtes déjà blacklistés par instagram');
        throw new Error('Veuillez changer de poste ou de IP');
      }
    });

    const newUrl = this.baseUrl + (suiteUrl ? suiteUrl : '');
    await this.page.goto(newUrl); // Remplacez par l'URL désirée

    if (reload) {
      await this.page.goto(newUrl);
    }

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

    return new Promise<void>((resolve, reject) => {
      // Fonction à exécuter de manière répétée
      const intervalID = setInterval(() => {
        process.stdout.write('.');
        if (endProcess) {
          this.page.off('response', () => {});
          // console.log('bodyREquest = ', this.bodyRequest);
          this.logger.info('Lancement du navigateur OK');
          clearInterval(intervalID);
          clearTimeout(timeoutID);

          resolve();
        }
      }, 500);

      // Arrêter l'exécution après le délai spécifié et résoudre la promesse
      const timeoutID = setTimeout(() => {
        clearInterval(intervalID);
        throw new Error('Veuillez verifier votre cookies de connexion');
        //resolve();
      }, 10_000);
    });
  }

  private async closeBrowser() {
    await this.browser.close();
  }

  private async addFollowers(pseudo, users) {
    await this.userService.saveAll(users);
    await this.userService.addFollowers(pseudo, users);
  }

  private async addFollowings(pseudo, users) {
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
        this.logger.debug(`Console error context page : ${message.text()}`);
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

    // await this.sleep(500_000);

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
            throw new Error(
              `${pseudo} : Error insta api follow by this url ${args.url}`,
            );
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
      const users = [];
      //sauvegarde des element un bdd
      for (let user of responseData.users) {
        try {
          const userDto = new UserDto();
          userDto.id = user.username;
          userDto.facebookId = user.fbid_v2;
          userDto.instagramId = user.pk;
          userDto.name = user.full_name;
          users.push(userDto);
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
          await this.addFollowers(pseudo, users);
        } else {
          await this.addFollowings(pseudo, users);
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
