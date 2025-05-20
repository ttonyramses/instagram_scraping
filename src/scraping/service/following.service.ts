import { inject, injectable } from 'inversify';
import { IFollowingService } from '../interface/ifollowing.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { Logger } from 'winston';
import { IBrowserService } from '../interface/ibrowser.service';
import { UserDto } from '../../domaine/user/dto/user.dto';
import { chromium } from 'playwright';
import { Pool, Worker, spawn } from 'threads';

@injectable()
export class FollowingService implements IFollowingService {
  private nbItemProcess: number;

  constructor(
    @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
    @inject(TYPES.IUserService) private readonly userService: IUserService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {}

  async getAllFollowings(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    pseudoList?: string[],
  ): Promise<void> {
    this.nbItemProcess = 0;
    await this.browserService.initBrowser(
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
        if (user.hasFollowings && !force) {
          this.logger.info(
            'Les followings de ' +
              pseudo +
              ' sont déjà présents dans la base de données',
          );
          continue;
        } else {
          await this.getAndSaveFollowings(user);
        }
      }
    } else {
      const users = force
        ? await this.userService.findAll()
        : await this.userService.findAllWithNoFollowings();
      let i = 0;

      const blockSize = parseInt(
        process.env.BLOCK_SIZE_THREAD_GET_FOLLOWINGS || '5000',
      );
      let indexBloc = 0;
      this.logger.info('nombre compte à traiter :  ' + users.length);
      for (let i = 0; i < users.length; i += blockSize) {
        indexBloc++;
        let block_users = users.slice(i, i + blockSize);
        this.logger.info(
          'start init Tasks for getAllFollowings block N° ' + indexBloc,
        );
        const pool = Pool(
          () => spawn(new Worker('../multithreading/worker')),
          parseInt(
            process.env.NB_THREAD_GET_FOLLOWINGS || '10',
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
              await this.getAndSaveFollowings(user);
            } catch (error) {
              this.logger.error(error);
              stopProcessing = true;
            }
          });
        });
        this.logger.info(
          'end init Tasks for getAllFollowings block N° ' + indexBloc,
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

  async getAndSaveFollowings(user: UserDto): Promise<void> {
    const followings = await this.getFollowingsByApi(user.instagramId, user.id);

    if (followings && followings.length > 0) {
      this.logger.debug(
        `save followings for user ${user.id} = ${followings.length}`,
      );
      await this.userService.saveFollowings(user.id, followings);
    } else {
      this.logger.debug(`not save followings for user ${user.id}`);
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

  async getFollowingsByApi(
    instagramId: number,
    pseudo: string,
  ): Promise<string[]> {
    const variables = `{"id":"${instagramId}","first":50}`;
    const __spin_t = Math.floor(Date.now() / 1000);
    const bodyRequest = this.browserService.getBodyRequest();
    bodyRequest.set('variables', variables);
    bodyRequest.set('__spin_t', __spin_t.toString());

    const response = await fetch(this.browserService.getUrlRequest(), {
      method: 'POST',
      headers: this.browserService.getHeadersRequest(),
      body: bodyRequest,
    });

    if (!response.ok) {
      this.logger.error(`pseudo ${pseudo} : erreur http ${response.status}`);

      if (response.status === 404) {
        this.logger.debug(`${pseudo} : ce pseudo est certainement desactivé`);
        return [];
      } else {
        throw new Error(
          `pseudo ${pseudo} : Veuillez rapidement reactiver votre compte`,
        );
      }
    } else {
      this.logger.debug(`pseudo ${pseudo} : status http ${response.status} OK`);
    }

    const followingsResponse = await response.json();
    const followings: string[] = [];

    if (
      followingsResponse &&
      followingsResponse.data &&
      followingsResponse.data.user &&
      followingsResponse.data.user.edge_follow &&
      followingsResponse.data.user.edge_follow.edges
    ) {
      for (const edge of followingsResponse.data.user.edge_follow.edges) {
        if (edge.node && edge.node.username) {
          followings.push(edge.node.username);
        }
      }
    }

    return followings;
  }

  async getFollowingsOnPage(pseudo: string): Promise<string[]> {
    const url = this.browserService.getBaseUrl() + '/' + pseudo + '/following';
    const myPage = await this.browserService.getContext().newPage();
    const followings: string[] = [];

    let endProcess = false;

    new Promise((resolve, reject) => {
      let hasGetFollowings = false;
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
          !hasGetFollowings
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
                  if (body.data.user.edge_follow.edges) {
                    endProcess = false;
                    hasGetFollowings = true;
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
          if (!hasGetFollowings) {
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
        response.data.user.edge_follow &&
        response.data.user.edge_follow.edges
      ) {
        for (const edge of response.data.user.edge_follow.edges) {
          if (edge.node && edge.node.username) {
            followings.push(edge.node.username);
          }
        }
      }
      endProcess = true;
    });

    try {
      await myPage.goto(url);
    } catch (error) {
      this.logger.error(`erreur go to page ${url} ${error.message}`);
      return followings;
    }

    return new Promise((resolve, reject) => {
      const intervalID = setInterval(async () => {
        if (endProcess) {
          await myPage.close();
          clearInterval(intervalID);
          clearTimeout(timeoutID);
          resolve(followings);
        }
      }, 500);

      const timeoutID = setTimeout(async () => {
        clearInterval(intervalID);
        await myPage.close();
        resolve(followings);
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
