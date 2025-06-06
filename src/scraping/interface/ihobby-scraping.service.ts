
export interface IHobbyScrapingService {
  applyHobbies(
    hobbies: string[],
    pseudoList?: string[],
  ): Promise<void>;

  getHobbiesByApi(
    instagramId: number,
    pseudo: string,
  ): Promise<string[]>;

  getHobbiesOnPage(pseudo: string): Promise<string[]>;
} 