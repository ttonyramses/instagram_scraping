import { inject, injectable } from 'inversify';
import { IAuthService } from '../interface/iauth.service';
import { TYPES } from '../../core/type.core';
import { Logger } from 'winston';
import { IBrowserService } from '../interface/ibrowser.service';
import { chromium } from 'playwright';
import { UserAuth } from '../type';
import {SelectorsConfig} from "../type";
import * as fs from 'fs';
import * as path from "node:path";


@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.IBrowserService) private readonly browserService: IBrowserService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {}
  async getCookiesInfos(loginJsonFileName: string, selectorsFileName: string):Promise<void>{
    const browser = await chromium.launch({
      headless: (process.env.HEADLESS || 'true') === 'true',
    });
    const context = await browser.newContext();
    context.setDefaultTimeout(parseInt('5000'));
    context.setDefaultNavigationTimeout(
        parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
    );
    const cookiesDir = process.env.COOKIES_JSON_DIR || '../../../.cookies';
    const cookiesPath = path.resolve(cookiesDir);
    const selectorsDir = process.env.SELECTORS_JSON_DIR || '../../../.selectors';
    const selectorsPath= path.resolve(selectorsDir);
    const loginPath = path.join(cookiesPath, loginJsonFileName.toString());
    const select = path.join(selectorsPath, selectorsFileName.toString());

    console.log('Scanning cookies directory:', cookiesPath);
    await context.grantPermissions(['notifications'], {
      origin: this.browserService.getBaseUrl(),
    });

    try {
      // Vérifier si le répertoire existe
      if (!fs.existsSync(cookiesPath)) {
        console.log('Creating cookies directory:', cookiesPath);
        fs.mkdirSync(cookiesPath, { recursive: true });
        console.log('Cookies before research cookies files:');
      }
      if (!fs.existsSync(loginPath)) {
        console.error('Login file not found:', loginPath);
        return;
      }

      if (!fs.existsSync(selectorsPath)) {
        console.error('Selectors file not found:', selectorsPath);
        return;
      }
      let logins : UserAuth[] ;
      let selectors : any;
      try {
        const loginData = fs.readFileSync(loginPath, 'utf8');
        logins = JSON.parse(loginData) as Array<UserAuth>;
        console.log('Loaded logins:', logins.length);

        const selectorsData = fs.readFileSync(select, 'utf8');
        selectors = JSON.parse(selectorsData) as SelectorsConfig;
      } catch (error) {
        console.error('Error reading configuration files:', error);
        return;
      }
      // Lire tous les fichiers .json dans le répertoire
      const files = fs.readdirSync(cookiesPath)
          .filter(file => file.endsWith('.json') && file.includes('cookie'))
          .sort(); // Trier pour avoir un ordre cohérent

      if (files.length === 0) {
        console.log('No cookie files found');
      }

      const page = await context.newPage();
      for (const user of logins) {
        await context.clearCookies();
        console.log('login = ', user);

        await page.goto('https://www.instagram.com/');

        try {
          await page.click(selectors.pageInfo.buttonAuthoriseCookies);
          console.log('Clique sur le bouton autorisation cookies',selectors.pageInfo.buttonAuthoriseCookies);
        } catch (error) {
          console.log('Pas de bouton autoriser cookies',error);
          try {
            await page.click(selectors.pageInfo.alternativeButtonAuthoriseCookies);
            console.log('Clique réussi avec sélecteur alternatif');
          } catch (altError) {
            console.log('Aucun bouton de cookies trouvé');
          }
        }

        try {
          await this.sleep(2_000);
          await page.waitForSelector(selectors.pageInfo.usernameInput);
          await page.fill(selectors.pageInfo.usernameInput, user.login);
          await page.fill(selectors.pageInfo.passwordInput, user.password);
          await page.click(selectors.pageInfo.submitButton);
          await page.waitForLoadState('networkidle');
          await this.sleep(5_000);
        } catch (error) {
          console.log('Erreur submit bouton', error);
        }

        try {
          await page.click(
              selectors.pageInfo.ignoreButton,
          );
        } catch (error) {
          console.log('Pas de bouton ignorer');
        }

        try {
          await page.click(selectors.pageInfo.laterButton,);
        } catch (error) {
          console.log('Pas de bouton Plus tard');
        }

        try {
          await page.click(selectors.pageInfo.acceptButton,);
        } catch (error) {
          console.log('Pas de bouton Accepter');
        }

        try {
          await page.click(selectors.pageInfo.acceptButton
               ,
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

    } catch (error) {
      console.error('Error processing cookies directory:', error);
    }
    finally {
      await browser.close();
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