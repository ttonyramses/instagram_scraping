import { BrowserContext, BrowserType, Page } from "playwright";

// ibrowser.service.ts
export interface IBrowserService {
    initBrowser(
      suiteUrl: string,
      browserType: BrowserType,
      cookiesFileName?: string,
      selectorsFileName?: string,
    ): Promise<void>;
    closeBrowser(): Promise<void>;
    getPage(): Page;
    getContext(): BrowserContext;
    getBaseUrl(): string;
    getHeadersRequest(): { [key: string]: string };
    getBodyRequest(): URLSearchParams;
    getUrlRequest(): string;
    setHeadersRequest(headers: { [key: string]: string }): void;
    setBodyRequest(body: URLSearchParams): void;
    setUrlRequest(url: string): void;
  }