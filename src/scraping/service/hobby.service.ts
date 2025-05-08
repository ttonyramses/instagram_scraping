import { inject, injectable } from 'inversify';
import { IHobbyScrapingService } from '../interface/ihobby.service';
import { TYPES } from '../../core/type.core';
import { IUserService } from '../../domaine/user/interface/iuser.service';
import { IHobbyService } from '../../domaine/hobby/interface/ihobby.service';
import { Logger } from 'winston';
import { HobbyDto } from '../../domaine/hobby/dto/hobby.dto';

@injectable()
export class HobbyScrapingService implements IHobbyScrapingService {
  constructor(
    @inject(TYPES.IUserService) private readonly userService: IUserService,
    @inject(TYPES.IHobbyService) private readonly hobbyService: IHobbyService,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {}

  async applyHobbies(hobbies: string[], pseudos: string[]): Promise<void> {
    this.logger.info(`Applying hobbies ${hobbies} to users ${pseudos}`);

    try {
      // Récupérer ou créer les hobbies
      const hobbyEntities: HobbyDto[] = [];
      for (const hobbyName of hobbies) {
        let hobby = await this.hobbyService.findByName(hobbyName);
        if (!hobby) {
          hobby = await this.hobbyService.create({
            name: hobbyName,
          });
        }
        hobbyEntities.push(hobby);
      }

      // Appliquer les hobbies aux utilisateurs
      for (const pseudo of pseudos) {
        const user = await this.userService.findByPseudo(pseudo);
        if (user) {
          for (const hobby of hobbyEntities) {
            await this.userService.addHobby(user.id, hobby.id);
          }
          this.logger.info(`Applied hobbies to user ${pseudo}`);
        } else {
          this.logger.warn(`User ${pseudo} not found`);
        }
      }

      this.logger.info('Hobbies applied successfully');
    } catch (error) {
      this.logger.error('Error applying hobbies:', error);
      throw error;
    }
  }
}
