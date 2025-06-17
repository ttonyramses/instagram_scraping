import { UserDto } from '../../../presentation/user/dto/user.dto';

export class SaveAllUsersCommand {
  constructor(public readonly userDtos: UserDto[]) {}
}
