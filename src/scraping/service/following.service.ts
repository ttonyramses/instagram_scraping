import { inject, injectable } from 'inversify';
import { IFollowingService } from '../interface/ifollowing.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { Logger } from 'winston';
import { IBrowserService } from '../interface/ibrowser.service';
import { UserDto } from '../../domaine/user/dto/user.dto';
import { Lock } from 'async-await-mutex-lock';
import { SleepUtil } from '../utils/sleep.util';
import { UserListResponse } from '../type';

@injectable()
export class FollowingService implements IFollowingService {
  private nbItemProcess: number;
  private stopCallApi: boolean;
  private lock = new Lock();
  private allFollowProcess = new Set();
  private waitAfterActionLong: number;
  private waitAfterActionShort: number;

  constructor(
    @inject(TYPES.IUserService) private readonly userService: IUserService,
    @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.SleepUtil) private readonly sleepUtil: SleepUtil,
  ) {
    this.nbItemProcess = 0;
    this.waitAfterActionLong = parseInt(
      process.env.WAIT_AFTER_ACTION_LONG || '2000',
    );
    this.waitAfterActionShort = parseInt(
      process.env.WAIT_AFTER_ACTION_SHORT || '500',
    );
  }

  async getAllFollowings(
    force: boolean,
    cookiesFileName: string,
    selectorsFileName: string,
    maxId?: string,
    nbFollow?: number,
    hobbies?: string[],
    pseudoList?: string[],
  ): Promise<void> {
    // Code adapté de getAllFollow pour les followings
  }

  async getFollowingsOfUser(
    userDto: UserDto,
    maxId: string,
    nbFollow: number,
  ): Promise<void> {
    // Code adapté de getFollowOfUser pour les followings
  }

  private async callApiAndSaveFollowings(
    url: string,
    userDto: UserDto,
  ): Promise<string> {
    // Code adapté de callApiAndSaveBdd pour les followings
  }

  private async addFollowings(pseudo: string, users: UserDto[]): Promise<void> {
    await this.userService.saveAll(users);
    await this.userService.addFollowings(pseudo, users);
  }
}
