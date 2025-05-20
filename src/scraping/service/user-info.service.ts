import { inject, injectable } from 'inversify';
import { IUserInfoService } from '../interface/iuser-info.service';
import { TYPES } from '../../core/type.core';
import { Logger } from 'winston';
import { IBrowserService } from '../interface/ibrowser.service';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { UserDto } from '../../domaine/user/dto/user.dto';
import { chromium } from 'playwright';
import { Pool, Worker, spawn } from 'threads';
import { User2ProfileResponse, UserProfileResponse } from '../type';

@injectable()
export class UserInfoService implements IUserInfoService {
  private nbItemProcess: number;

  constructor(
    @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
    @inject(TYPES.IUserService) private readonly userService: IUserService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {}

  async getAllInfos(
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
    await this.browserService.closeBrowser();
    this.logger.info(
      'Nombre total des utilisateurs mise à jour : ' + this.nbItemProcess,
    );
  }

  async getAndSaveInfoUser(user: UserDto): Promise<void> {
    const userDto = await this.getInfoUserApiByPseudo(user.id);

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

  async getInfoUserApiByPseudo(pseudo: string): Promise<UserDto> {
    const response = await fetch(
      encodeURI(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${pseudo}`,
      ),
      {
        method: 'GET',
        headers: this.browserService.getHeadersRequest(),
      },
    );
    const user = new UserDto();
    user.id = pseudo;
    console.log("response.headers = ", response.headers);

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

    const userJson = await response.json();
    const userResponse: User2ProfileResponse = userJson;

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
      user.json = userJson;
    } else {
      this.logger.debug(`${pseudo} : ce pseudo est certainement desactivé`);
      user.nbFollowers = 0;
      user.nbFollowings = 0;
      user.enable = false;
      user.hasInfo = true;
    }
    return user;
  }

  async getInfoUserByApi(
    instagramId: number,
    pseudo: string,
  ): Promise<UserDto> {
    const variables = `{"id":"${instagramId}","render_surface":"PROFILE"}`;
    const __spin_t = Math.floor(Date.now() / 1000);
    const bodyRequest = this.browserService.getBodyRequest();
    bodyRequest.set('variables', variables);
    bodyRequest.set('__spin_t', __spin_t.toString());

    const response = await fetch(this.browserService.getUrlRequest(), {
      method: 'POST',
      headers: this.browserService.getHeadersRequest(),
      body: bodyRequest,
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

  async getInfoUserOnPage(pseudo: string): Promise<UserDto> {
    const user = new UserDto();
    const url = this.browserService.getBaseUrl() + '/' + pseudo;
    const myPage = await this.browserService.getContext().newPage();

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
      const intervalID = setInterval(async () => {
        if (endProcess) {
          await myPage.close();
          clearInterval(intervalID);
          clearTimeout(timeoutID);
          resolve(user);
        }
      }, 500);

      const timeoutID = setTimeout(async () => {
        clearInterval(intervalID);
        await myPage.close();
        resolve(user);
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