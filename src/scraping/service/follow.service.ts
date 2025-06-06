import {inject, injectable} from 'inversify';
import {IFollowService} from '../interface/IFollowService';
import {TYPES} from '../../core/type.core';
import {IUserService} from '../../domaine/user/interface/iuser.service';
import {Logger} from 'winston';
import {IBrowserService} from '../interface/ibrowser.service';
import {UserDto} from '../../domaine/user/dto/user.dto';
import {chromium} from 'playwright';
import {Pool, spawn, Worker} from 'threads';
import {Follow, UserListResponse} from "../type";
import { Lock } from 'async-await-mutex-lock';

@injectable()
export class FollowService implements IFollowService {
  private nbItemProcess: number;
  private stopCallApi: boolean;
  private allFollowProcess = new Set();
  private lock = new Lock();


  constructor(
      @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
      @inject(TYPES.IUserService) private readonly userService: IUserService,
      @inject(TYPES.Logger) private readonly logger: Logger,
  ) {}

  async getAllFollowers(
      follow: Follow,
      force: boolean,
      cookiesFileName: string,
      selectorsFileName: string,
      maxId?: string,
      nbFollow?: number,
      hobbies?: string[],
      pseudoList?: string[],
  ): Promise<void> {
    nbFollow = nbFollow ?? parseInt(process.env.NB_FOLLOW_PROCESS || '5000')
        this.nbItemProcess = 0;
    await this.browserService.initBrowser(
        '/egliseicc_normandie',
        chromium,
        cookiesFileName,
        selectorsFileName,
    );
    if (pseudoList && pseudoList.length > 0) {
      if(hobbies && hobbies.length > 0){
        for (const pseudo of pseudoList) {
          const user = await this.userService.findOneUser(pseudo);
          if (!user) {
            this.logger.info('user ' + pseudo + ' not found ');
            continue;
          }
          if ((follow== Follow.FOLLOWER && user.hasFollowerProcess && !force) || (follow == Follow.FOLLOWING && user.hasFollowingProcess && !force)){
            this.logger.info(
                'Les follow(ers/ings) de ' + user.id + ' sont déjà présents dans la base de données',
            );
            continue
          }else{
            try{
               await this.getAndSaveFollowers(user,follow,maxId,nbFollow);
               if(this.nbItemProcess >= nbFollow){
                 this.logger.info(`Nombre maximal de utilisateur a traiter atteint soit (${this.nbItemProcess}), fin du programme`);
                 break;
               }
            }catch (error){
              this.logger.error(' getAllFollowers', error);

            }
          }
        }
      }
    } else {
      const users = force
          ? await this.userService.findAll()
          : await this.userService.findAllWithNoFollowers();
      let i = 0;

      const blockSize = parseInt(
          process.env.BLOCK_SIZE_THREAD_GET_FOLLOWERS || '5000',
      );
      let indexBloc = 0;
      this.logger.info('nombre compte à traiter :  ' + users.length);
      for (let i = 0; i < users.length; i += blockSize) {
        indexBloc++;
        let block_users = users.slice(i, i + blockSize);
        this.logger.info(
            'start init Tasks for getAllFollowers block N° ' + indexBloc,
        );
        const pool = Pool(
            () => spawn(new Worker('../multithreading/worker')),
            parseInt(
                process.env.NB_THREAD_GET_FOLLOWERS || '10',
            ),
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
              await this.getAndSaveFollowers(user,follow,maxId,nbFollow);
            } catch (error) {
              this.logger.error(error);
              stopProcessing = true;
            }
          });
        });
        this.logger.info(
            'end init Tasks for getAllFollowers block N° ' + indexBloc,
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
    await this.browserService.closeBrowser();
    this.logger.info(
        'Nombre total des utilisateurs mise à jour : ' + this.nbItemProcess,
    );
  }

  async getAndSaveFollowers
  (user: UserDto,
   follow: Follow,
   maxId?: string,
  nbFollow?: number,
  ): Promise<void> {
    let currentMaxId = maxId ??user.maxIdFollower;
    if (follow === Follow.FOLLOWER) {
      this.logger.info(
          'Debut des traitements des followers pour le pseudo ' + user.id,
      );
    } else {
      this.logger.info(
          'Debut des traitements des followings pour le pseudo ' + user.id,
      );
    }
    this.stopCallApi = false;
    do{
      console.log(`${user.instagramId}, user: ${user.id}`);
      const newUrl = `https://www.instagram.com/api/v1/friendships/${user.instagramId}/${follow == Follow.FOLLOWER ? 'followers' : 'following'}/?count=25${maxId ? '&max_id=' + currentMaxId : ''}${follow == Follow.FOLLOWER ? '&search_surface=follow_list_page' : ''}`;
      this.logger.debug('newUrl = ' + newUrl);
      maxId = await this.callApiAndSaveBdd(newUrl, follow, user);
      if (this.nbItemProcess %
          parseInt(process.env.NB_FOLLOW_QUERY_PROCESS || '100') == 0)
      {
        await this.sleep(2_000);
      }
      if (this.stopCallApi) {
        this.logger.debug('break');
        break;
      }
    }
    while (
        !this.stopCallApi && (nbFollow == undefined || this.nbItemProcess < nbFollow)
    );
    await this.sleep(this.getRandomNumber(500, 2000));


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



  }


  private async addFollowers(pseudo, users) {
    await this.userService.saveAll(users);
    await this.userService.addFollowers(pseudo, users);
  }


  private async addFollowings(pseudo, users) {
    await this.userService.saveAll(users);
    await this.userService.addFollowings(pseudo, users);
  }

  private async callApiAndSaveBdd(
      url: string,
      follow: Follow,
      userDto: UserDto,
  ): Promise<string> {
    const pseudo = userDto.id;
    let responseData;
    try {

      const response = await fetch(url, {
        headers: this.browserService.getHeadersRequest(),
      });
      if (!response.ok) {
        throw new Error(
            `${pseudo} : Error insta api follow by this url ${url} | ${response.status} | ${response.statusText}}`,
        );
      }
      responseData = (await response.json()) as UserListResponse;
    } catch (error) {
      this.logger.error('Error: ' + error);
    }

    if (responseData) {
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
            if ((follow == Follow.FOLLOWER)||(follow == Follow.FOLLOWING) ) {
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
          if (!this.stopCallApi) {
            userDto.maxIdFollower = responseData.next_max_id;
          }
          userDto.hasFollowerProcess = this.stopCallApi;
        } else {
          await this.addFollowings(pseudo, users);
          if (!this.stopCallApi) {
            userDto.maxIdFollowing = responseData.next_max_id;
          }
          userDto.hasFollowingProcess = this.stopCallApi;
        }
        await this.userService.save(userDto);
      } finally {
        //console.log('releases lock')
        this.lock.release();
      }
      return responseData.next_max_id;
    } else {
      throw new Error('Error call api');
    }
  }

  async getFollowersOnPage(pseudo: string): Promise<string[]> {
    const url = this.browserService.getBaseUrl() + '/' + pseudo + '/followers';
    const myPage = await this.browserService.getContext().newPage();
    const followers: string[] = [];

    let endProcess = false;

    new Promise((resolve, reject) => {
      let hasGetFollowers = false;
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

        if (request.resourceType() === 'xhr' && matchLoginPage) {
          this.logger.info('Vous êtes déjà blacklistés par instagram');
          endProcess = true;
          throw new Error('Veuillez changer de poste ou de IP');
        } else if (
            request.resourceType() === 'xhr' &&
            matchGraphQl &&
            !hasGetFollowers
        ) {
          const postData = request.postData();
          const payload = new URLSearchParams(postData);
          try {
            const variables = payload.get('variables');

            if (variables) {
              const variablesObj = JSON.parse(variables);
              if (variablesObj.first === 50) {
                if (response.status() === 200) {
                  const textBody = await response.text();
                  const body = JSON.parse(textBody);
                  if (body.data.user.edge_followed_by.edges) {
                    endProcess = false;
                    hasGetFollowers = true;
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
          if (!hasGetFollowers) {
            this.logger.debug(
                `${pseudo} : ce pseudo est certainement desactivé`,
            );
            endProcess = true;
          }
        }
      });
    }).then((response: any) => {
      if (
          response &&
          response.data &&
          response.data.user &&
          response.data.user.edge_followed_by &&
          response.data.user.edge_followed_by.edges
      ) {
        for (const edge of response.data.user.edge_followed_by.edges) {
          if (edge.node && edge.node.username) {
            followers.push(edge.node.username);
          }
        }
      }
      endProcess = true;
    });

    try {
      await myPage.goto(url);
    } catch (error) {
      this.logger.error(`erreur go to page ${url} ${error.message}`);
      return followers;
    }

    return new Promise((resolve, reject) => {
      const intervalID = setInterval(async () => {
        if (endProcess) {
          await myPage.close();
          clearInterval(intervalID);
          clearTimeout(timeoutID);
          resolve(followers);
        }
      }, 500);

      const timeoutID = setTimeout(async () => {
        clearInterval(intervalID);
        await myPage.close();
        resolve(followers);
      }, 10_000);
    });
  }

  private sleep(timeMilliSeconde: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
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