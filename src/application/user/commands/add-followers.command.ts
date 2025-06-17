import { UserDto } from '../../../presentation/user/dto/user.dto';

export class AddFollowersCommand {
  constructor(
    public readonly userId: string,
    public readonly followers: UserDto[],
  ) {}
}
