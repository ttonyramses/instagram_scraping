import { inject, injectable } from 'inversify';
import { IBrowserService } from '../interface/ibrowser.service';
import { TYPES } from '../../core/type.core';
import { Browser, BrowserContext, BrowserType, Page, chromium } from 'playwright';
import { Logger } from 'winston';

@injectable()
export class BrowserService implements IBrowserService {
  private page: Page;
  private context: BrowserContext;
  private browser: Browser;
  private baseUrl: string;
  private headersRequest: { [key: string]: string };
  private bodyRequest: URLSearchParams;
  private urlRequest: string;

  constructor(@inject(TYPES.Logger) private readonly logger: Logger) {
    this.baseUrl = process.env.BASE_SCRAPING_URL || 'https://www.instagram.com';
  }

  async initBrowser(
    suiteUrl: string,
    browserType: BrowserType,
    cookiesFileName?: string,
    selectorsFileName?: string,
  ): Promise<void> {
    // Code actuel de initBrowser
  }

  async closeBrowser(): Promise<void> {
    await this.browser.close();
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
    return this.headersRequest;
  }

  getBodyRequest(): URLSearchParams {
    return this.bodyRequest;
  }

  getUrlRequest(): string {
    return this.urlRequest;
  }

  setHeadersRequest(headers: { [key: string]: string }): void {
    this.headersRequest = headers;
  }

  setBodyRequest(body: URLSearchParams): void {
    this.bodyRequest = body;
  }

  setUrlRequest(url: string): void {
    this.urlRequest = url;
  }
}