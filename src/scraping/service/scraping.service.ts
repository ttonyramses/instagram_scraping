import { inject, injectable } from 'inversify';
import { IScrapingService } from '../interface/iscraping.service';
import { TYPES } from '../../core/type.core';
import { Logger } from 'winston';
import { IBrowserService } from '../interface/ibrowser.service';
import { IAuthService } from '../interface/iauth.service';
import { IUserInfoService } from '../interface/iuser-info.service';
import { IHobbyScrapingService } from '../interface/ihobby.service';
import { Follow } from '../type';
import {IFollowService} from "../interface/IFollowService";


@injectable()
export class ScrapingService implements IScrapingService {
  constructor(
    @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
    @inject(TYPES.IAuthService) private readonly authService: IAuthService,
    @inject(TYPES.IUserInfoService) private readonly userInfoService: IUserInfoService,
    @inject(TYPES.IFollowService) private readonly followService: IFollowService,
    @inject(TYPES.IHobbyScrapingService) private readonly hobbyService: IHobbyScrapingService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {}

  async getCookiesInfos(
    loginJsonFileName: string,
    selectorsFileName: string,
  ): Promise<void> {
    return this.authService.getCookiesInfos(loginJsonFileName, selectorsFileName);
  }

  async getAllInfos(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    pseudoList?: string[],
  ): Promise<void> {
    return this.userInfoService.getAllInfos(
      force,
      cookiesFileName,
      selectorsFileName,
      pseudoList,
    );
  }

  async getAllFollow(
    follow: Follow,
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    maxId?: string,
    nbFollow?: number,
    hobbies?: string[],
    pseudoList?: string[],
  ): Promise<void> {
    if ((follow === Follow.FOLLOWER)||(follow === Follow.FOLLOWING)) {
      return this.followService.getAllFollowers(
        follow,
        force,
        cookiesFileName,
        selectorsFileName,
        maxId,
        nbFollow,
        hobbies,
        pseudoList,
      );
    }
  }

  async applyHobbies(hobbies: string[], pseudos: string[]): Promise<void> {
    return this.hobbyService.applyHobbies(hobbies, pseudos);
  }
}