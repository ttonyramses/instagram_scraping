import { inject, injectable } from 'inversify';
import { IBrowserService } from '../interface/ibrowser.service';
import { TYPES } from '../../core/type.core';
import { Browser, BrowserContext, BrowserType, Page } from 'playwright';
import { Logger } from 'winston';
import { Lock } from 'async-await-mutex-lock';
import path from "node:path";
import fs from "fs";

@injectable()
export class BrowserService implements IBrowserService {

  private page: Page;
  private context: BrowserContext;
  private browser: Browser;
  private baseUrl: string;
  private waitAfterActionLong: number;
  private waitAfterActionShort: number;
  private _headersRequest: { [key: string]: string };
  private bodyRequest: URLSearchParams;
  private urlRequest: string;
  private lock = new Lock();

  constructor(
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

  async initBrowser(
    suiteUrl: string,
    browserType: BrowserType,
    cookiesFileName?: string,
    selectorsFileName?: string,
  ): Promise<void> {
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
    const cookiesDir = process.env.COOKIES_JSON_DIR || '../../../.cookies';
    const cookiesPath = path.resolve(cookiesDir);
    const cookiesFile =  path.join(cookiesPath,cookiesFileName.toString())


    if (cookiesFile) {
      const cookiesFileExists = fs.readFileSync(cookiesFile, 'utf8');
      const cookiesFileExistsJson = JSON.parse(cookiesFileExists);
      await this.context.addCookies(cookiesFileExistsJson);
    }

    await this.context.grantPermissions(['notifications'], {
      origin: this.baseUrl,
    });

    this.page = await this.context.newPage();

    let endProcess = false;
    let hasGetInfo = false;
    let reload = false;
    this.page.on('response', async (response) => {
      const request = response.request();
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
                this._headersRequest = await request.headers();
                this._headersRequest['cookie'] = allHeaders['cookie'];
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
    await this.page.goto(newUrl);

    if (reload) {
      await this.page.goto(newUrl);
    }

    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

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
      const intervalID = setInterval(() => {
        process.stdout.write('.');
        if (endProcess) {
          this.page.off('response', () => {});
          this.logger.info('Lancement du navigateur OK');
          clearInterval(intervalID);
          clearTimeout(timeoutID);

          resolve();
        }
      }, 500);

      const timeoutID = setTimeout(() => {
        clearInterval(intervalID);
        throw new Error('Veuillez verifier votre cookies de connexion');
      }, 10_000);
    });
  }

  async closeBrowser(): Promise<void> {
    await this.browser.close();
  }

  get headersRequest(): { [p: string]: string } {
    return this._headersRequest;
  }

  getPage(): Page {
    return this.page;
  }

  getContext(): BrowserContext {
    return this.context;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getHeadersRequest(): { [key: string]: string } {
    return this._headersRequest;
  }

  getBodyRequest(): URLSearchParams {
    return this.bodyRequest;
  }

  getUrlRequest(): string {
    return this.urlRequest;
  }

  setHeadersRequest(headers: { [key: string]: string }): void {
    this._headersRequest = headers;
  }

  setBodyRequest(body: URLSearchParams): void {
    this.bodyRequest = body;
  }

  setUrlRequest(url: string): void {
    this.urlRequest = url;
  }

  private sleep(timeMilliSeconde: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeMilliSeconde);
    });
  }
}