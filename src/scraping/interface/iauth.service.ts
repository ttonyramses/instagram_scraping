// iauth.service.ts
export interface IAuthService {
  getCookiesInfos(
    loginJsonFileName: string,
    selectorsFileName: string,
  ): Promise<void>;
}
