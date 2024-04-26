import { inject, injectable } from 'inversify';
import { IScrapingService } from '../interface/iscraping.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { UserDto } from '../../domaine/user/dto/user.dto';

@injectable()
export class ScrapingService implements IScrapingService {
  private page: Page;
  private browser: Browser;
  private isBrowserInitialized: boolean = false;
  private baseUrl: string;

  constructor(
    @inject(TYPES.IUserService) private readonly userService: IUserService,
  ) {
    this.baseUrl = process.env.BASE_SCRAPING_URL;
  }

  async applyHobbies(hobby: string, pseudos: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getOneInfos(
    pseudo: string,
    force: boolean,
    cookiesFileName?: string,
  ): Promise<void> {
    const user = await this.userService.findOneUser(pseudo);
    console.log('user =', user);
    console.log('force =', force);
    if (user.hasInfo && !force) {
      console.log(
        'Les information de ' +
          pseudo +
          ' sont déjà présentes dans la base de données',
      );
      return;
    } else {
      await this.initBrowser('/' + pseudo, cookiesFileName);
      const userDto = await this.getInfoUserOnPage(this.page);
      await this.userService.save(userDto);
      await this.closeBrowser();
    }
  }

  async getAllInfos(force: boolean, cookiesFileName?: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async getOneFollow(
    pseudo: string,
    force: boolean,
    cookiesFileName?: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getAllFollow(
    hobby: string,
    force: boolean,
    cookiesFileName?: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private async initBrowser(suiteUrl: string, cookiesFileName?: string) {
    this.browser = await chromium.launch({ headless: false }); // Mode non headless pour visualiser le défilement
    const context: BrowserContext = await this.browser.newContext();

    // Autoriser les notifications
    const cookies = (
      await import(process.env.COOKIES_JSON_DIR + '/' + cookiesFileName)
    ).default;
    await context.grantPermissions(['notifications'], {
      origin: this.baseUrl,
    });

    this.page = await context.newPage();

    await context.addCookies(cookies);

    const newUrl = this.baseUrl + (suiteUrl ? suiteUrl : '');
    console.log('newUrl = ', newUrl);
    await this.page.goto(newUrl); // Remplacez par l'URL désirée
  }

  private async closeBrowser() {
    await this.browser.close();
  }

  private async getInfoUserOnPage(page: Page): Promise<UserDto> {
    const user = new UserDto();
    await this.sleep(1_000);
    user.id = await page
      .locator('main.xvbhtw8 header.x1qjc9v5 section div.x9f619')
      .first()
      .textContent();

    user.nbFollowers = parseInt(
      await page
        .locator(
          'main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(2) span._ac2a',
        )
        .first()
        .textContent(),
    );

    user.nbFollowing = parseInt(
      await page
        .locator(
          'main.xvbhtw8 header.x1qjc9v5 section ul li:nth-child(3) span._ac2a',
        )
        .first()
        .textContent(),
    );

    user.name = await page
      .locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z span.x1lliihq')
      .first()
      .textContent();

    user.biography = await page
      .locator('main.xvbhtw8 header.x1qjc9v5 section div.x7a106z h1')
      .first()
      .textContent();

    user.hasInfo = true;

    return user;
  }

  private async sleep(time: number): Promise<void> {
    await setTimeout(() => {}, time);
  }
}
