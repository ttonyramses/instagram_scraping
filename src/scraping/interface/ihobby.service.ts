// ihobby.service.ts
export interface IHobbyScrapingService {
  applyHobbies(hobbies: string[], pseudos: string[]): Promise<void>;
}
