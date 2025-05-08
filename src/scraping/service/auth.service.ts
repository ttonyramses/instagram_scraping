import { inject, injectable } from 'inversify';
import { IAuthService } from '../interface/iauth.service';
import { TYPES } from '../../core/type.core';
import { Logger } from 'winston';
import { IBrowserService } from '../interface/ibrowser.service';
import { UserAuth } from '../type';
import * as fs from 'fs';
import { SleepUtil } from '../utils/sleep.util';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.SleepUtil) private readonly sleepUtil: SleepUtil,
  ) {}

  async getCookiesInfos(
    loginJsonFileName: string,
    selectorsFileName: string,
  ): Promise<void> {
    // Code actuel de getCookiesInfos
  }
}