import { inject, injectable } from 'inversify';
import { IAuthService } from '../interface/iauth.service';
import { TYPES } from '../../core/type.core';
import { Logger } from 'winston';
import { IBrowserService } from '../interface/ibrowser.service';
import { chromium } from 'playwright';
import { UserAuth } from '../type';
import * as fs from 'fs';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {}

  async getCookiesInfos(
    loginJsonFileName: string,
    selectorsFileName: string,
  ): Promise<void> {
    const browser = await chromium.launch({
      headless: (process.env.HEADLESS || 'true') === 'true',
    });
    const context = await browser.newContext();
    context.setDefaultTimeout(parseInt('5000'));
    context.setDefaultNavigationTimeout(
      parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
    );

    const logins = (await import(loginJsonFileName)) as Array<UserAuth>;

    await context.grantPermissions(['notifications'], {
      origin: this.browserService.getBaseUrl(),
    });

    const page = await context.newPage();

    for (const user of logins) {
      await context.clearCookies();
      console.log('login = ', user);

      await page.goto('https://www.instagram.com/');

      try {
        await page.click('div > button._a9--._ap36._a9_0');
      } catch (error) {
        console.log('Pas de bouton autoriser cookies');
      }

      try {
        await this.sleep(2_000);
        await page.waitForSelector('input[name="username"]');
        await page.fill('input[name="username"]', user.login);
        await page.fill('input[name="password"]', user.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await this.sleep(5_000);
      } catch (error) {
        console.log('Erreur submit bouton', error);
      }

      try {
        await page.click(
          'section > main div.wbloks_1.wbloks_78 > div > div > div:nth-child(2) > div:nth-child(2) > div',
        );
      } catch (error) {
        console.log('Pas de bouton ignorer');
      }

      try {
        await page.click(
          'div.x9f619.xvbhtw8.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.x1q0g3np.xqjyukv.x1qjc9v5.x1oa3qoh.x1qughib > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y > section > main > div > div > div > div',
        );
      } catch (error) {
        console.log('Pas de bouton Plus tard');
      }

      try {
        await page.click(
          'div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xefnots.x1wt1izd.xv7j57z.xixehch > div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xx6bls6 > div > div:nth-child(1) > div > div > div',
        );
      } catch (error) {
        console.log('Pas de bouton Accepter');
      }

      try {
        await page.click(
          'div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xefnots.x1wt1izd.xv7j57z.xixehch > div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xx6bls6 > div > div:nth-child(1) > div > div',
        );
      } catch (error) {
        console.log('Pas de bouton suite Acceptation');
      }

      const cookies = await context.cookies();
      const stringCookies = JSON.stringify(cookies, null, 2);
      fs.writeFileSync(
        (process.env.COOKIES_JSON_DIR || '../../../.cookies') +
          '/' +
          user.login +
          '.json',
        stringCookies,
      );
    }
  }

  private sleep(timeMilliSeconde: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeMilliSeconde);
    });
  }
}