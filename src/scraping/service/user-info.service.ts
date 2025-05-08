import { inject, injectable } from 'inversify';
import { IUserInfoService } from '../interface/iuser-info.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { Logger } from 'winston';
import { IBrowserService } from '../interface/ibrowser.service';
import { UserDto } from '../../domaine/user/dto/user.dto';
import { Pool, Worker, spawn } from 'threads';
import { SleepUtil } from '../utils/sleep.util';
import { RandomUtil } from '../utils/random.util';
import { User2ProfileResponse, UserProfileResponse } from '../type';

@injectable()
export class UserInfoService implements IUserInfoService {
  private nbItemProcess: number;

  constructor(
    @inject(TYPES.IUserService) private readonly userService: IUserService,
    @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.SleepUtil) private readonly sleepUtil: SleepUtil,
    @inject(TYPES.RandomUtil) private readonly randomUtil: RandomUtil,
  ) {
    this.nbItemProcess = 0;
  }

  async getAllInfos(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    pseudoList?: string[],
  ): Promise<void> {
    // Code actuel de getAllInfos
  }

  async getAndSaveInfoUser(user: UserDto): Promise<void> {
    // Code actuel de getAndSaveInfoUser
  }

  async getInfoUserApiByPseudo(pseudo: string): Promise<UserDto> {
    // Code actuel de getInfoUserApiByPseudo
  }

  async getInfoUserByApi(
    instagramId: number,
    pseudo: string,
  ): Promise<UserDto> {
    // Code actuel de getInfoUserByApi
  }

  async getInfoUserOnPage(pseudo: string): Promise<UserDto> {
    // Code actuel de getInfoUserOnPage
  }
}